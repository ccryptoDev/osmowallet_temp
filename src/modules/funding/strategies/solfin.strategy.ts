import { BadRequestException } from "@nestjs/common";
import Decimal from "decimal.js";
import { DynamicDtoValidator } from "src/common/dto_validators/dynamic.validator";
import { Partner } from "src/common/enums/partner.enum";
import { Status } from "src/common/enums/status.enum";
import { TransactionMethodEnum } from "src/common/enums/transactionMethod.enum";
import { TransactionType } from "src/common/enums/transactionsType.enum";
import { TransactionSubtype } from "src/common/enums/transactionSubtype.enum";
import { findAndLockWallet } from "src/common/utils/find-and-lock-wallet";
import { Coin } from "src/entities/coin.entity";
import { FundingTransactionLimit } from "src/entities/fundingTransactionLimits.entity";
import { TierFunding } from "src/entities/tierFunding.entity";
import { TierUser } from "src/entities/tierUser.entity";
import { Transaction } from "src/entities/transaction.entity";
import { TransactionGroup } from "src/entities/transactionGroup.entity";
import { User } from "src/entities/user.entity";
import { Wallet } from "src/entities/wallet.entity";
import { CoinEnum } from "src/modules/me/enums/coin.enum";
import { SolfingCurrency } from "src/modules/solfin/enums/currency.enum";
import { SolfinFundingPayload } from "src/modules/solfin/interfaces/funding";
import { SolfinService } from "src/modules/solfin/solfin.service";
import { SlackChannel } from "src/services/slack/enums/slack-channels.enum";
import { SlackEmoji } from "src/services/slack/enums/slack-emoji.enum";
import { SlackWebhooks } from "src/services/slack/enums/slack-webhooks.enum";
import { SlackService } from "src/services/slack/slack.service";
import { createTransactionsTemplate } from "src/services/slack/templates/transactions.template";
import { EntityManager } from "typeorm";
import { FundingDto } from "../dtos/funding.dto";
import { SolfinFundingDto } from "../dtos/solfin.dto";
import { FundingMethodEnum } from "../enums/fundingMethod.enum";
import { Funding } from "./funding";


export class SolfinFunding implements Funding {
    private coin: Coin
    private solfinFundingDto: SolfinFundingDto
    constructor(
        private body: FundingDto,
        private user: User,
        private manager: EntityManager,
        private solfinService: SolfinService,
    ){}
    
    async fund(): Promise<void> {
        await this.validateInputData()
        const payload: SolfinFundingPayload = {
            userId: this.user.id,
            amount: this.body.amount,
            currency: this.coin.acronym,
            description: this.solfinFundingDto.description,
            documentFrom: this.solfinFundingDto.documentFrom,
            documentTypeFrom: this.solfinFundingDto.documentTypeFrom,
            emailFrom: this.solfinFundingDto.emailFrom,
            ibanFrom: this.solfinFundingDto.ibanFrom,
            nameFrom: this.solfinFundingDto.nameFrom
        }
        await this.solfinService.funding(payload)

        const amountToReceive = this.body.amount
        await this.manager.transaction('SERIALIZABLE', async entityManager => {
            const [userWallet] = await Promise.all([
                findAndLockWallet({ entityManager: entityManager, coinId: this.coin.id, userId: this.user.id }),
            ])
            userWallet.availableBalance = Decimal.add(userWallet.availableBalance, amountToReceive).toNumber()
            userWallet.balance = Decimal.add(userWallet.balance, amountToReceive).toNumber()

            await entityManager.save(Wallet, [userWallet])
            const transactionGroup = entityManager.create(TransactionGroup, {
                status: Status.COMPLETED,
                type: TransactionType.FUNDING,
                fromUser: { id: this.user.id },
                transactionCoin: this.coin,
                partner: Partner.SOLFIN,
                method: TransactionMethodEnum.CASH_IN
            })
            await entityManager.insert(TransactionGroup, transactionGroup)
            const userTransaction = entityManager.create(Transaction, {
                subtype: TransactionSubtype.CREDIT_FIAT_FUNDING,
                amount: new Decimal(amountToReceive).toNumber(),
                balance: userWallet.availableBalance,
                transactionGroup: transactionGroup,
                wallet: userWallet,
            })

            const fundingTransactionLimit = await entityManager.findOne(FundingTransactionLimit, {
                where: {
                    user: { id: this.user.id },
                    fundingmethod: { id: this.body.fundingMethodId }
                },
            })

            fundingTransactionLimit.dailyAmassedAmount += new Decimal(amountToReceive).toNumber()
            fundingTransactionLimit.monthlyAmassedAmount += new Decimal(amountToReceive).toNumber()

            await entityManager.save(fundingTransactionLimit)

            await Promise.all([
                entityManager.insert(Transaction,[userTransaction]),
            ])
        })

        SlackService.notifyTransaction({
            baseURL: SlackWebhooks.OSMO_FUNDING,
            data: createTransactionsTemplate({
                channel: SlackChannel.OSMO_FUNDING,
                amount: this.body.amount,
                coin: CoinEnum[this.coin.acronym],
                firstName: this.user.firstName,
                lastName: this.user.lastName,
                email: this.user.email,
                transactionType: {
                    name: FundingMethodEnum.TRANSFER,
                    emoji: SlackEmoji.FLAG_CR
                },
                attachmentUrl: "https://firebasestorage.googleapis.com/v0/b/osmowallet.appspot.com/o/logo_cuadrado.png?alt=media&token=955446df-d591-484c-986f-1211a14dad98"
            })
        })
    }

    private async validateInputData() {
        this.solfinFundingDto = await DynamicDtoValidator.validateInputData(this.body.data, SolfinFundingDto)

        const coin = await this.manager.findOneBy(Coin, { id: this.body.coinId })
        if (!coin) throw new BadRequestException('Invalid coin')
        if (!Object.values(SolfingCurrency).includes(coin.acronym as SolfingCurrency)) throw new BadRequestException('Invalid coin');
        this.coin = coin;

        const [fundingTransactionLimit, tierUser] = await Promise.all([
            this.manager.findOne(FundingTransactionLimit, {
                where: {
                    user: { id: this.user.id },
                    fundingmethod: { id: this.body.fundingMethodId }
                },
            }),
            this.manager.findOne(TierUser, {
                where: {
                    user: {
                        id: this.user.id
                    }
                }
            })
        ])

        const dailyAmountToAmass = fundingTransactionLimit.dailyAmassedAmount + (this.body.amount / this.coin.exchangeRate)
        const monthlyAmountToAmass = fundingTransactionLimit.monthlyAmassedAmount + (this.body.amount / this.coin.exchangeRate)

        const tierFunding = await this.manager.findOne(TierFunding, {
            where: {
                fundingMethod: { id: this.body.fundingMethodId },
                tier: tierUser.tier
            },
        })

        if (this.body.amount > tierFunding.max) throw new BadRequestException('Este monto excede el maximo permitido por transacción')
        if (this.body.amount <= tierFunding.min) throw new BadRequestException('Este monto no alcanza el minimo permitido por transacción')
        if (dailyAmountToAmass > tierFunding.dailyLimit) throw new BadRequestException('Alcanzaste tu limite diario')
        if (monthlyAmountToAmass > tierFunding.monthlyLimit) throw new BadRequestException('Alcanzaste tu limite mensual')
    }

}