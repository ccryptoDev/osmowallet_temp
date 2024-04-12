import { Funding } from "./funding";
import { User } from "src/entities/user.entity";
import { FundingDto } from "../dtos/funding.dto";
import { OnvoCheckoutSuccess } from "../interfaces/onvo.checkout.success";
import { EntityManager } from "typeorm";
import { Coin } from "src/entities/coin.entity";
import { TransactionType } from "src/common/enums/transactionsType.enum";
import { FundingMethodEnum } from "../enums/fundingMethod.enum";
import { Wallet } from "src/entities/wallet.entity";
import { TransactionGroup } from "src/entities/transactionGroup.entity";
import Decimal from "decimal.js";
import { TransactionFee } from "src/entities/transactionFee.entity";
import { Transaction } from "src/entities/transaction.entity";
import { Partner } from "src/common/enums/partner.enum";
import { Status } from "src/common/enums/status.enum";
import { TransactionMethodEnum } from "src/common/enums/transactionMethod.enum";
import { TransactionSubtype } from "src/common/enums/transactionSubtype.enum";
import { CardService } from "src/modules/card/card.service";
import { ValidatorData } from "src/common/dto_validators/validator-data";
import { OnvoFundingDto } from "../dtos/onvo.dto";
import { findAndLockWallet } from "src/common/utils/find-and-lock-wallet";
import { SlackService } from "src/services/slack/slack.service";
import { SlackWebhooks } from "src/services/slack/enums/slack-webhooks.enum";
import { createTransactionsTemplate } from "src/services/slack/templates/transactions.template";
import { SlackChannel } from "src/services/slack/enums/slack-channels.enum";
import { CoinEnum } from "src/modules/me/enums/coin.enum";
import { SlackEmoji } from "src/services/slack/enums/slack-emoji.enum";
import { TierFunding } from "src/entities/tierFunding.entity";
import { BadRequestException } from "@nestjs/common";
import { GoogleCloudTasksService } from "src/services/google-cloud-tasks/google-cloud-tasks.service";
import { UpdateBalance } from "src/modules/balance-updater/interfaces/updateBalance";
import { UpdateBalanceTransferType } from "src/modules/balance-updater/enums/type.enum";
import { BalanceUpdaterService } from "src/modules/balance-updater/balance-updater.service";
import { TierUser } from "src/entities/tierUser.entity";
import { FundingTransactionLimit } from "src/entities/fundingTransactionLimits.entity";
import { FeeSource } from "src/common/enums/fee-source.enum";




export class OnvoFunding implements Funding{
    private coin: Coin
    private fee: number
    constructor(
        private user: User,
        private manager: EntityManager,
        private body: OnvoCheckoutSuccess,
        private googleCloudTaskService: GoogleCloudTasksService
    ){}
    
    static async pay(cardService: CardService, body: FundingDto, user: User, amount: number) {
        const data: OnvoFundingDto = await ValidatorData.validate<OnvoFundingDto>(body.data,OnvoFundingDto)
        await cardService.pay(user.id,amount,data.paymentMethodId)
    }

    async fund() : Promise<any> {
        await this.setDataToUse()
        const totalAmount = new Decimal(this.body.data.amount).div(100)
        const denominatorFee = new Decimal(this.fee).add(1)
        const amountToReceive = new Decimal(new Decimal(totalAmount).sub(0.25).div(denominatorFee).toFixed(2)).toNumber();
        const totalFee = new Decimal(new Decimal(totalAmount).sub(amountToReceive).toFixed(2)).toNumber();
        console.log('totalAmount', totalAmount)
        console.log('amountToReceive', denominatorFee)
        console.log('amountToReceive', amountToReceive)
        console.log('totalFee',totalFee)
        await this.manager.transaction('SERIALIZABLE', async entityManager => {
            const  [userWallet] = await Promise.all([
                findAndLockWallet({entityManager: entityManager, coinId: this.coin.id, userId: this.user.id}),
            ])
            const updatedAvailableBalance = Decimal.add(userWallet.availableBalance, amountToReceive).toNumber();
            const updatedBalance = Decimal.add(userWallet.balance, amountToReceive).toNumber();

            await entityManager.update(Wallet, userWallet.id, { availableBalance: updatedAvailableBalance, balance: updatedBalance });
            const transactionGroup = entityManager.create(TransactionGroup,{
                status: Status.COMPLETED,
                type: TransactionType.FUNDING,
                fromUser: {id: this.user.id},
                transactionCoin: this.coin,
                partner: Partner.ONVO,
                method: TransactionMethodEnum.CREDIT_CARD
            })
            await entityManager.insert(TransactionGroup,transactionGroup)
            const userTransaction = entityManager.create(Transaction,{
                subtype: TransactionSubtype.CREDIT_FIAT_FUNDING,
                amount: new Decimal(amountToReceive).toNumber(),
                balance: userWallet.availableBalance,
                transactionGroup: transactionGroup,
                wallet: userWallet,
            })

            const feeRecord = entityManager.create(TransactionFee, {
                amount: totalFee,
                coin: this.coin,
                transactionGroup: transactionGroup,
                source: FeeSource.ONVO
            })
            await Promise.all([
                entityManager.insert(Transaction,[userTransaction]),
                entityManager.insert(TransactionFee,feeRecord)
            ])

            const fundingTransactionLimit = await entityManager.findOne(FundingTransactionLimit, {
                where: {
                    user: { id: this.user.id },
                    fundingmethod: { name: TransactionMethodEnum.CREDIT_CARD }
                },
            })

            fundingTransactionLimit.dailyAmassedAmount += new Decimal(amountToReceive).toNumber()
            fundingTransactionLimit.monthlyAmassedAmount += new Decimal(amountToReceive).toNumber()

            await entityManager.save(fundingTransactionLimit)
        })

        SlackService.notifyTransaction({ 
            baseURL: SlackWebhooks.FUNDING_CARD, 
            data: createTransactionsTemplate({ 
              channel: SlackChannel.FUNDING_CARD, 
              amount: this.body.data.amount, 
              coin: CoinEnum[this.coin.acronym],
              firstName: this.user.firstName,
              lastName: this.user.lastName,
              email: this.user.email, 
              transactionType: {
                name: FundingMethodEnum.CREDIT_CARD,
                emoji: SlackEmoji.CREDIT_CARD
              }, 
              attachmentUrl: "https://firebasestorage.googleapis.com/v0/b/osmowallet.appspot.com/o/logo_cuadrado.png?alt=media&token=955446df-d591-484c-986f-1211a14dad98"
            }) 
        })
        const payload: UpdateBalance = {
            amount: amountToReceive,
            coinId: this.coin.id,
            type: UpdateBalanceTransferType.OSMO_TO_USER,
            userId: this.user.id
        }
        this.googleCloudTaskService.createInternalTask(BalanceUpdaterService.queue,payload,BalanceUpdaterService.url)
    }


    private async setDataToUse() {
        const [coin, tierUser] = await Promise.all([
            this.manager.findOneBy(Coin,{acronym: 'USD'}),
            this.manager.findOneBy(TierUser,{user: this.user})
        ])
        this.coin = coin
        
        const tierFunding = await this.manager.findOne(TierFunding,{
            where: {
                fundingMethod: {name: TransactionMethodEnum.CREDIT_CARD },
                tier: tierUser.tier
            },
        })

        this.fee = tierFunding.fee
        
        
        const fundingTransactionLimit = await this.manager.findOne(FundingTransactionLimit,{
            where: {
                user: {id: this.user.id},
                fundingmethod: { name: TransactionMethodEnum.CREDIT_CARD }
            },
        })
        
        const dailyAmountToAmass = fundingTransactionLimit.dailyAmassedAmount + (this.body.data.amount / this.coin.exchangeRate)
        const monthlyAmountToAmass = fundingTransactionLimit.monthlyAmassedAmount + (this.body.data.amount / this.coin.exchangeRate)

        if(this.body.data.amount > tierFunding.max) throw new BadRequestException('Este monto excede el maximo permitido por transacción')
        if(this.body.data.amount <= tierFunding.min) throw new BadRequestException('Este monto no alcanza el minimo permitido por transacción')
        if(dailyAmountToAmass > tierFunding.dailyLimit) throw new BadRequestException('Alcanzaste tu limite diario')
        if(monthlyAmountToAmass > tierFunding.monthlyLimit) throw new BadRequestException('Alcanzaste tu limite mensual')

    }
}