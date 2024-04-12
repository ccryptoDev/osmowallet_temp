import { BadRequestException } from "@nestjs/common";
import Decimal from "decimal.js";
import { DynamicDtoValidator } from "src/common/dto_validators/dynamic.validator";
import { MainWalletsAccount } from "src/common/enums/main-wallets.enum";
import { Status } from "src/common/enums/status.enum";
import { TransactionMethodEnum } from "src/common/enums/transactionMethod.enum";
import { TransactionType } from "src/common/enums/transactionsType.enum";
import { TransactionSubtype } from "src/common/enums/transactionSubtype.enum";
import { formatDateToSpanish } from "src/common/utils/date-formatter.util";
import { findAndLockWallet } from "src/common/utils/find-and-lock-wallet";
import { Bank } from "src/entities/bank.entity";
import { Coin } from "src/entities/coin.entity";
import { FundingMethod } from "src/entities/fundingMethod.entity";
import { FundingTransactionLimit } from "src/entities/fundingTransactionLimits.entity";
import { TierFunding } from "src/entities/tierFunding.entity";
import { TierUser } from "src/entities/tierUser.entity";
import { TransactionDetail } from "src/entities/transaction.detail.entity";
import { Transaction } from "src/entities/transaction.entity";
import { TransactionGroup } from "src/entities/transactionGroup.entity";
import { User } from "src/entities/user.entity";
import { CoinEnum } from "src/modules/me/enums/coin.enum";
import { SendGridService } from "src/modules/send-grid/send-grid.service";
import { FundingPendingTemplate } from "src/modules/send-grid/templates/funding/fundingPending.template";
import { FundingPendingOsmoTemplate } from "src/modules/send-grid/templates/funding/fundingPendingOsmo.template";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/google-cloud-storage.service";
import { SlackChannel } from "src/services/slack/enums/slack-channels.enum";
import { SlackEmoji } from "src/services/slack/enums/slack-emoji.enum";
import { SlackWebhooks } from "src/services/slack/enums/slack-webhooks.enum";
import { SlackService } from "src/services/slack/slack.service";
import { createTransactionsTemplate } from "src/services/slack/templates/transactions.template";
import { EntityManager } from "typeorm";
import { FundingDto } from "../dtos/funding.dto";
import { OsmoFundingDto } from "../dtos/osmoFunding.dto";
import { FundingMethodEnum } from "../enums/fundingMethod.enum";
import { Funding } from "./funding";

export class OsmoBankFunding extends DynamicDtoValidator implements Funding {
    private coin: Coin
    private methodDto: OsmoFundingDto
    private bank: Bank
    private fundingTransactionLimit: FundingTransactionLimit

    constructor(
        private manager: EntityManager,
        private user: User,
        private body: FundingDto,
        private googleCloudStorageService: GoogleCloudStorageService,
        private sendGridService: SendGridService,
        private file: Express.Multer.File,
        private fundingMethod: FundingMethod
    ) { super() }

    async fund() {
        await this.validateData()
        const proofData = await this.getProofData(this.file, this.user)
        await this.manager.transaction('SERIALIZABLE', async entityManager => {
            const [userWallet, osmoWallet] = await Promise.all([
                findAndLockWallet({ entityManager: entityManager, coinId: this.coin.id, userId: this.user.id }),
                findAndLockWallet({ entityManager: entityManager, coinId: this.coin.id, alias: MainWalletsAccount.MAIN })
            ])
            const method: TransactionMethodEnum = TransactionMethodEnum[this.fundingMethod.name]
            const transactionGroup = entityManager.create(TransactionGroup, {
                status: Status.PENDING,
                fromUser: this.user,
                transactionCoin: this.coin,
                type: TransactionType.FUNDING,
                method: method,
                metadata: {
                    bankAddress: this.bank
                }
            })

            await entityManager.insert(TransactionGroup, transactionGroup)
            const osmoCreditTransaction = entityManager.create(Transaction, {
                amount: this.body.amount,
                transactionGroup: { id: transactionGroup.id },
                wallet: { id: osmoWallet.id },
                subtype: TransactionSubtype.CREDIT_FIAT_FUNDING_OSMO,
                balance: osmoWallet.availableBalance
            })

            const userCreditTransaction = entityManager.create(Transaction, {
                transactionGroup: { id: transactionGroup.id },
                amount: this.body.amount,
                wallet: { id: userWallet.id },
                subtype: TransactionSubtype.CREDIT_FIAT_FUNDING,
                balance: userWallet.availableBalance,
            })
            await entityManager.insert(Transaction, [osmoCreditTransaction, userCreditTransaction])
            const transactionDetail = entityManager.create(TransactionDetail, {
                transaction: { id: userCreditTransaction.id },
                proofUrl: proofData.proofUrl,
                proofPath: proofData.proofPath,
                proofExpiry: new Date(proofData.proofUrlExpiry),
            })
            await entityManager.insert(TransactionDetail, transactionDetail)
            this.fundingTransactionLimit.dailyAmassedAmount = new Decimal(this.fundingTransactionLimit.dailyAmassedAmount).plus(new Decimal(this.body.amount).dividedBy(this.coin.exchangeRate).toFixed(2)).toNumber()
            this.fundingTransactionLimit.monthlyAmassedAmount = new Decimal(this.fundingTransactionLimit.monthlyAmassedAmount).plus(new Decimal(this.body.amount).dividedBy(this.coin.exchangeRate).toFixed(2)).toNumber()
            await entityManager.save(FundingTransactionLimit, this.fundingTransactionLimit)
            this.notify(transactionGroup)
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
                    emoji: SlackEmoji.BANK
                },
                attachmentUrl: proofData.proofUrl
            })
        })
    }

    async notify(transactionGroup: TransactionGroup) {
        const date = new Date()
        const template = new FundingPendingTemplate(
            [{ email: this.user.email, name: this.user.firstName }],
            {
                amount: this.body.amount,
                currency: this.coin.acronym,
                date: formatDateToSpanish(date),
                status: Status.PENDING,
                transactionId: transactionGroup.id
            },
        )
        this.sendGridService.sendMail(template)
        const emails = process.env.ENV == 'PROD'
            ? [{ email: 'victor@osmowallet.com', name: 'Victor' }, { email: 'piero@osmowallet.com', name: 'Piero' }]
            : [{ email: 'as@singularagency.co', name: 'Piero' }]
        const osmoTemplate = new FundingPendingOsmoTemplate(
            emails,
            this.user.firstName + ' ' + this.user.lastName,
            this.user.email,
            { amount: this.body.amount, currency: this.coin.acronym, date: formatDateToSpanish(date), status: Status.PENDING, transactionId: transactionGroup.id }
        )
        this.sendGridService.sendMail(osmoTemplate)
    }

    async validateData() {
        if (!this.file) {
            throw new BadRequestException('File not found');
        }

        this.methodDto = await DynamicDtoValidator.validateInputData<OsmoFundingDto>(this.body.data, OsmoFundingDto)
        this.coin = await this.manager.findOneBy(Coin, { id: this.body.coinId })
        if (!this.coin) throw new BadRequestException('Invalid coin')

        const [fundingTransactionLimit, tierUser] = await Promise.all([
            this.manager.findOne(FundingTransactionLimit, {
                where: {
                    user: { id: this.user.id },
                    fundingmethod: { id: this.fundingMethod.id }
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

        this.bank = await this.manager.findOne(Bank, {
            where: {
                id: this.methodDto.bankId,
            }
        })
        if (!this.bank) throw new BadRequestException('Invalid bank')
        const dailyAmountToAmass = fundingTransactionLimit.dailyAmassedAmount + (this.body.amount / this.coin.exchangeRate)
        const monthlyAmountToAmass = fundingTransactionLimit.monthlyAmassedAmount + (this.body.amount / this.coin.exchangeRate)
        console.log(fundingTransactionLimit, this.user)

        const tierFunding = await this.manager.findOne(TierFunding, {
            where: {
                fundingMethod: { id: this.fundingMethod.id },
                tier: tierUser.tier
            },
        })

        if (this.body.amount > tierFunding.max) throw new BadRequestException('Este monto excede el maximo permitido por transacción')
        if (this.body.amount <= tierFunding.min) throw new BadRequestException('Este monto no alcanza el minimo permitido por transacción')
        if (dailyAmountToAmass > tierFunding.dailyLimit) throw new BadRequestException('Alcanzaste tu limite diario')
        if (monthlyAmountToAmass > tierFunding.monthlyLimit) throw new BadRequestException('Alcanzaste tu limite mensual')
        this.fundingTransactionLimit = fundingTransactionLimit
    }

    private async getProofData(file: Express.Multer.File, user: User): Promise<{ proofUrl: string, proofPath: string, proofUrlExpiry: number }> {
        const proofUrlExpiry = Date.now() + 3600 * 1000 * 7
        const proofPath = `Users/${user.id}/proofs/${Date.now()}-${file.originalname}`
        await this.googleCloudStorageService.saveFile(file, proofPath)
        const proofUrl = await this.googleCloudStorageService.getSignedUrl(proofPath, proofUrlExpiry)
        return { proofUrl, proofPath, proofUrlExpiry }
    }
}