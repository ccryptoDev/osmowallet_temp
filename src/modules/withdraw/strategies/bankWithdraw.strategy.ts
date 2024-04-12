import { BadRequestException } from "@nestjs/common";
import { validate } from "class-validator";
import Decimal from "decimal.js";
import { FeatureEnum } from "src/common/enums/feature.enum";
import { Status } from "src/common/enums/status.enum";
import { TransactionMethodEnum } from "src/common/enums/transactionMethod.enum";
import { TransactionSubtype } from "src/common/enums/transactionSubtype.enum";
import { TransactionType } from "src/common/enums/transactionsType.enum";
import { BankAccount } from "src/entities/bank.account.entity";
import { Coin } from "src/entities/coin.entity";
import { Feature } from "src/entities/feature.entity";
import { TierFeature } from "src/entities/tierFeature.entity";
import { Transaction } from "src/entities/transaction.entity";
import { TransactionFee } from "src/entities/transactionFee.entity";
import { TransactionGroup } from "src/entities/transactionGroup.entity";
import { User } from "src/entities/user.entity";
import { UserTransactionLimit } from "src/entities/userTransactionLimit.entity";
import { WithdrawalMethod } from "src/entities/withdrawalMethod.entity";
import { SendGridService } from "src/modules/send-grid/send-grid.service";
import { WithdrawalPendingTemplate } from "src/modules/send-grid/templates/withdrawal/withdrawalPending.template";
import { EntityManager } from "typeorm";
import { BankWithdrawDto } from "../dtos/bankWithdraw.dto";
import { WithdrawDto } from "../dtos/withdraw.dto";
import { Withdraw } from "./withdraw";
import { formatDateToSpanish } from "src/common/utils/date-formatter.util";
import { findAndLockWallet } from "src/common/utils/find-and-lock-wallet";
import { MainWalletsAccount } from "src/common/enums/main-wallets.enum";
import { SlackService } from "src/services/slack/slack.service";
import { SlackWebhooks } from "src/services/slack/enums/slack-webhooks.enum";
import { createTransactionsTemplate } from "src/services/slack/templates/transactions.template";
import { SlackChannel } from "src/services/slack/enums/slack-channels.enum";
import { CoinEnum } from "src/modules/me/enums/coin.enum";
import { WithdrawalMethodEnum } from "../enums/withdrawalMethod.enum";
import { SlackEmoji } from "src/services/slack/enums/slack-emoji.enum";
import { Wallet } from "src/entities/wallet.entity";
import { WithdrawalPendingOsmoTemplate } from "src/modules/send-grid/templates/withdrawal/withdrawalPendingOsmo.template";


export class BankWithdraw implements Withdraw{
    private bankWithdraw: BankWithdrawDto
    private coin: Coin
    constructor(
        private manager: EntityManager,
        private user: User, 
        private data: WithdrawDto, 
        private sendGridService: SendGridService,
        private tierFeature: TierFeature,
    ){}

    async withdraw(): Promise<any> {
        await this.validInputData()
        
        const [user, feature,fundingMethod] = await Promise.all([
            this.manager.findOneBy(User,{id: this.user.id}),
            this.manager.findOneBy(Feature,{name: FeatureEnum.WITHDRAW}),
            this.manager.findOneBy(WithdrawalMethod,{name: TransactionMethodEnum.TRANSFER}),
        ])
        const bankAccount = await this.manager.findOne(BankAccount,{
            relations: {bank: true,coin: true},
            where: {
                id: this.bankWithdraw.bankAccountId,
            }
        })
        const records = await this.manager.findOne(UserTransactionLimit,{
            where: {
                user: {id: user.id},
                feature: {id: feature.id}
            },
        })
        await this.checkDailyMonthlyLimits(records, this.data, this.coin)

        await this.manager.transaction('SERIALIZABLE', async entityManager => {
            if(!bankAccount) throw new BadRequestException('Invalid bank account')
            let feePercent = 0
            feePercent = fundingMethod.fee
            const [wallet, osmoWallet, osmoWalletFee] = await Promise.all([
                findAndLockWallet({entityManager: entityManager,coinId: this.coin.id,userId: this.user.id}),
                findAndLockWallet({entityManager: entityManager,coinId: this.coin.id,alias: MainWalletsAccount.MAIN}),
                findAndLockWallet({entityManager: entityManager,coinId: this.coin.id,alias: MainWalletsAccount.FEES}),
            ])
            if(wallet.availableBalance < this.data.amount) throw new BadRequestException('Insufficient balance')
            const newAvailableBalance = new Decimal(wallet.availableBalance).minus(this.data.amount).toNumber();
            const fee = parseFloat((new Decimal(this.data.amount).mul(feePercent)).toFixed(2));
            const osmoAmountToDebit = new Decimal(this.data.amount).minus(fee).toNumber();
            await entityManager.update(Wallet, wallet.id, { availableBalance: newAvailableBalance });
            const transactionGroup = entityManager.create(TransactionGroup,{
                status: Status.PENDING,
                fromUser: user,
                transactionCoin: this.coin,
                type: TransactionType.WITHDRAW,
                method: TransactionMethodEnum.TRANSFER,
                metadata: {
                    bankAddress: {
                        type: bankAccount.bankAccountType,
                        accountNumber: bankAccount.accountNumber,
                        accountHolder: bankAccount.accountHolder,
                        bankName: bankAccount.bank.name,
                        bankCode: bankAccount.bank.code,
                        currency: this.coin.acronym
                    }
                }
            })
            await entityManager.save(TransactionGroup,transactionGroup,{reload: true})
            
            const osmoDebitTransaction = entityManager.create(Transaction,{
                amount: osmoAmountToDebit,
                transactionGroup: transactionGroup,
                wallet: osmoWallet,
                subtype: TransactionSubtype.DEBIT_FIAT_WITHDRAW_OSMO,
                balance: osmoWallet.availableBalance
            })

            const osmoFeeTransaction = entityManager.create(Transaction,{
                amount: fee,
                transactionGroup: transactionGroup,
                wallet: osmoWalletFee,
                subtype: TransactionSubtype.FEE_WITHDRAW,
                balance: osmoWalletFee.availableBalance
            })

            const transactionRecord = entityManager.create(Transaction,{
                transactionGroup: transactionGroup,
                amount: this.data.amount,
                wallet: wallet,
                subtype: TransactionSubtype.DEBIT_FIAT_WITHDRAW,
                balance: wallet.availableBalance,
            })
            await entityManager.insert(Transaction,[transactionRecord,osmoFeeTransaction,osmoDebitTransaction])
            records.dailyAmassedAmount = new Decimal(records.dailyAmassedAmount).plus(this.data.amount / this.coin.exchangeRate).toNumber()
            records.monthlyAmassedAmount = new Decimal(records.monthlyAmassedAmount).plus(this.data.amount / this.coin.exchangeRate).toNumber()
            await entityManager.save(records)
            const osmoFee = entityManager.create(TransactionFee,{
                amount: fee,
                coin: this.coin,
                transactionGroup: transactionGroup
            })
            await entityManager.insert(TransactionFee,osmoFee)
            this.notify(user, transactionGroup)
        })
        SlackService.notifyTransaction({ 
            baseURL: SlackWebhooks.WITHDRAW_BANK, 
            data: createTransactionsTemplate({ 
              channel: SlackChannel.WITHDRAW_BANK, 
              amount: this.data.amount, 
              coin: CoinEnum[this.coin.acronym],
              firstName: this.user.firstName, 
              lastName: this.user.lastName, 
              email: this.user.email, 
              transactionType: {
                name: WithdrawalMethodEnum.TRANSFER,
                emoji: SlackEmoji.BANK
              }, 
              attachmentUrl: "https://firebasestorage.googleapis.com/v0/b/osmowallet.appspot.com/o/logo_cuadrado.png?alt=media&token=955446df-d591-484c-986f-1211a14dad98" 
            }) 
        })
    }

    async validInputData() {
        const bankWithdrawDto = new BankWithdrawDto();
        const parsedData = JSON.parse(this.data.data);
        bankWithdrawDto.bankAccountId = parsedData.bankAccountId;
        const errors = await validate(bankWithdrawDto);
        if (errors.length > 0) {
            const messageError = errors.map(error => Object.values(error.constraints)).join(', ');
            throw new BadRequestException(messageError);
        }
        this.coin = await this.manager.findOneBy(Coin,{
            id: this.data.coinId
        })
        if(!this.coin || this.coin.acronym == 'SATS') throw new BadRequestException('Invalid coin')
        this.bankWithdraw = bankWithdrawDto
    }

    private notify(user: User, transactionGroup: TransactionGroup) {
        const emails = process.env.ENV == 'PROD'
        ? [{ email: 'victor@osmowallet.com', name: 'Victor' }, { email: 'piero@osmowallet.com', name: 'Piero' }]
        : [{ email: 'as@singularagency.co', name: 'Piero' }]
        const osmoTemplate = new WithdrawalPendingOsmoTemplate(
            emails,
            user.firstName + ' '+ user.lastName,
            user.email,
            {amount: this.data.amount, currency: transactionGroup.transactionCoin.acronym, date: (new Date()).toDateString(),status: Status.PENDING,transactionId: transactionGroup.id}
            )
        const date = new Date()
        const template = new WithdrawalPendingTemplate(
            [{email: user.email,name: user.firstName},],
            {amount: this.data.amount, currency: transactionGroup.transactionCoin.acronym, date: formatDateToSpanish(date),status: Status.PENDING,transactionId: transactionGroup.id}
            )
        this.sendGridService.sendMail(osmoTemplate)
        this.sendGridService.sendMail(template)
    }

    private async checkDailyMonthlyLimits(records: UserTransactionLimit, data: WithdrawDto, coin: Coin) {
        
        const dailyAmountToAmass = records.dailyAmassedAmount + (data.amount / coin.exchangeRate)
        const monthlyAmountToAmass = records.monthlyAmassedAmount + (data.amount / coin.exchangeRate)
        if(dailyAmountToAmass > this.tierFeature.dailyLimit) throw new BadRequestException('Alcanzaste tu limite diario')
        if(monthlyAmountToAmass > this.tierFeature.monthlyLimit) throw new BadRequestException('Alcanzaste tu limite mensual')
    }
}