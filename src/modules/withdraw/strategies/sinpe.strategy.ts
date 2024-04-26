import { EntityManager } from "typeorm";
import { WithdrawDto } from "../dtos/withdraw.dto";
import { Withdraw } from "./withdraw";
import { Coin } from "src/entities/coin.entity";
import { SinpeWithdrawDto } from "../dtos/sinpe.withdraw.dto";
import { Status } from "src/common/enums/status.enum";
import { Wallet } from "src/entities/wallet.entity";
import Decimal from "decimal.js";
import { TransactionType } from "src/common/enums/transactionsType.enum";
import { TransactionMethodEnum } from "src/common/enums/transactionMethod.enum";
import { TransactionGroup } from "src/entities/transactionGroup.entity";
import { Transaction } from "src/entities/transaction.entity";
import { User } from "src/entities/user.entity";
import { Partner } from "src/common/enums/partner.enum";
import { GoogleCloudTasksService } from "src/services/google-cloud-tasks/google-cloud-tasks.service";
import { SolfinWithdrawPayload } from "src/modules/solfin/interfaces/withdraw";
import { DynamicDtoValidator } from "src/common/dto_validators/dynamic.validator";
import { SolfinService } from "src/modules/solfin/solfin.service";
import { BadRequestException } from "@nestjs/common";
import { TransactionSubtype } from "src/common/enums/transactionSubtype.enum";
import { TransactionFee } from "src/entities/transactionFee.entity";
import { CoinEnum } from "src/modules/me/enums/coin.enum";
import { findAndLockWallet } from "src/common/utils/find-and-lock-wallet";
import { MainWalletsAccount } from "src/common/enums/main-wallets.enum";
import { SlackService } from "src/services/slack/slack.service";
import { SlackWebhooks } from "src/services/slack/enums/slack-webhooks.enum";
import { createTransactionsTemplate } from "src/services/slack/templates/transactions.template";
import { SlackChannel } from "src/services/slack/enums/slack-channels.enum";
import { WithdrawalMethodEnum } from "../enums/withdrawalMethod.enum";
import { SlackEmoji } from "src/services/slack/enums/slack-emoji.enum";
import { UpdateBalanceTransferType } from "src/modules/balance-updater/enums/type.enum";
import { BalanceUpdaterService } from "src/modules/balance-updater/balance-updater.service";
import { UpdateBalance } from "src/modules/balance-updater/interfaces/updateBalance";
import { PushNotificationService } from "src/modules/push-notification/push-notification.service";
import { WithdrawalMethod } from "src/entities/withdrawalMethod.entity";
import { FeeSource } from "src/common/enums/fee-source.enum";

export interface RefundSinpePayload {
    amount: number,
    fee: number,
    userId: string,
    error: any,
    transactionGroupId: string
}
export class SinpeWithdraw implements Withdraw {
    private coin: Coin
    private methodDto: SinpeWithdrawDto

    constructor(
        private body: WithdrawDto,
        private manager: EntityManager,
        private user: User,
        private googleCloudTaskService: GoogleCloudTasksService,
        private solfinService: SolfinService,
        private pushNotificationService: PushNotificationService,
        private withdrawMethod: WithdrawalMethod
    ){}
    
    async withdraw(): Promise<any> {
        await this.validateInputData()
        const payload: SolfinWithdrawPayload = {
            amount: this.body.amount,
            currency: this.coin.acronym,
            description: this.methodDto.description,
            iban_to: this.methodDto.ibanTo,
            document_to: this.methodDto.documentTo,
            document_type_to: this.methodDto.documentTypeTo,
            email_to: this.methodDto.emailTo,
            name_to: this.methodDto.emailTo,
            userId: this.user.id
        }
        const rate = this.coin.acronym == CoinEnum.USD ? new Decimal(1) : new Decimal(this.coin.exchangeRate)
        const amountToWithdraw = new Decimal(this.body.amount)
        let fee = new Decimal(0)
        const thresholdAmount = new Decimal(100);
        const feeRate = new Decimal(this.withdrawMethod.fee);
        const isCRC = this.coin.acronym === CoinEnum.CRC;
        const adjustedAmount = isCRC ? amountToWithdraw.dividedBy(this.coin.exchangeRate) : amountToWithdraw;

        fee = adjustedAmount.greaterThan(thresholdAmount) ? adjustedAmount.times(feeRate) : new Decimal(rate);
        fee = new Decimal(fee.toFixed(2))
        const sinpeFee = new Decimal(0.80).toNumber(); // $0.80 Solfin fee
        const osmoFee = new Decimal(fee).minus(sinpeFee).toNumber()
        const amountToUserDebit = new Decimal(this.body.amount).plus(fee).toNumber();
        console.log(`Payload:`, payload);
        console.log(`BCCR Rate:`, this.coin.exchangeRate);
        console.log(`Rate:`, rate.toString());
        console.log(`Amount to Withdraw:`, amountToWithdraw.toString());
        console.log(`Fee:`, fee.toString());
        console.log(`Threshold Amount:`, thresholdAmount.toString());
        console.log(`Fee Rate:`, feeRate.toString());
        console.log(`Is CRC:`, isCRC);
        console.log(`Adjusted Amount:`, adjustedAmount.toString());
        console.log(`Sinpe Fee:`, sinpeFee);
        console.log(`Osmo Fee:`, osmoFee.toString());
        console.log(`Amount to User Debit:`, amountToUserDebit);
        let transactionGroup: TransactionGroup
        await this.manager.transaction('SERIALIZABLE', async entityManager => {
            const [userWallet,osmoFeeWallet] = await Promise.all([
                findAndLockWallet({entityManager: entityManager,coinId: this.coin.id,userId: this.user.id}),
                findAndLockWallet({entityManager: entityManager,coinId: this.coin.id,alias: MainWalletsAccount.FEES}),
            ])

            if(userWallet.availableBalance < this.body.amount) throw new BadRequestException('Insufficient balance')
            await Promise.all([
                entityManager.update(Wallet,userWallet.id, {
                    availableBalance: new Decimal(userWallet.availableBalance).minus(amountToUserDebit).toNumber(),
                    balance: new Decimal(userWallet.balance).minus(amountToUserDebit).toNumber()
                }),
                entityManager.update(Wallet,osmoFeeWallet.id, {
                    availableBalance: new Decimal(osmoFeeWallet.availableBalance).plus(osmoFee).toNumber(),
                    balance: new Decimal(osmoFeeWallet.balance).plus(osmoFee).toNumber()
                }),
            ])

            transactionGroup = entityManager.create(TransactionGroup,{
                status: Status.COMPLETED,
                type: TransactionType.WITHDRAW,
                method: TransactionMethodEnum.TRANSFER,
                partner: Partner.SOLFIN,
                fromUser: { id: this.user.id },
                transactionCoin: { id: this.coin.id },
            })
            await entityManager.insert(TransactionGroup,transactionGroup)
            const userTransaction = entityManager.create(Transaction,{
                subtype: TransactionSubtype.DEBIT_FIAT_WITHDRAW,
                amount: amountToUserDebit,
                balance: userWallet.availableBalance,
                transactionGroup: transactionGroup,
                wallet: userWallet,
            })
            const osmoFeeWalletTransaction = entityManager.create(Transaction,{
                subtype: TransactionSubtype.FEE_WITHDRAW,
                amount: osmoFee,
                balance: osmoFeeWallet.availableBalance,
                transactionGroup: transactionGroup,
                wallet: osmoFeeWallet,
            })

            await entityManager.insert(Transaction,[userTransaction,osmoFeeWalletTransaction])
            const sinpeFeeTransaction = entityManager.create(TransactionFee,{
                amount: sinpeFee,
                coin: {id: this.coin.id},
                transactionGroup: {id: transactionGroup.id},
                source: FeeSource.SOLFIN
            })
            const osmoFeeTransaction = entityManager.create(TransactionFee,{
                amount: osmoFee,
                coin: {id: this.coin.id},
                transactionGroup: {id: transactionGroup.id},
            })
            await entityManager.insert(TransactionFee,[sinpeFeeTransaction,osmoFeeTransaction])
        })

        this.solfinService.withdraw(payload)
        .then(() => {
            const updateFeePayload: UpdateBalance = {
                amount: osmoFee,
                coinId: this.body.coinId,
                type: UpdateBalanceTransferType.USER_TO_OSMO,
                userId: this.user.id
            }
            this.googleCloudTaskService.createInternalTask(BalanceUpdaterService.queue,updateFeePayload,BalanceUpdaterService.url)
            SlackService.notifyTransaction({ 
                baseURL: SlackWebhooks.OSMO_WITHDRAW, 
                data: createTransactionsTemplate({ 
                  channel: SlackChannel.OSMO_WITHDRAW, 
                  amount: this.body.amount, 
                  coin: CoinEnum[this.coin.acronym],
                  firstName: this.user.firstName, 
                  lastName: this.user.lastName, 
                  email: this.user.email, 
                  transactionType: {
                    name: WithdrawalMethodEnum.SINPE,
                    emoji: SlackEmoji.FLAG_CR
                  }, 
                  attachmentUrl: "https://firebasestorage.googleapis.com/v0/b/osmowallet.appspot.com/o/logo_cuadrado.png?alt=media&token=955446df-d591-484c-986f-1211a14dad98" 
                }) 
        })
        .catch((error) => this.refundTransaction({
            amount: amountToUserDebit,
            error: error,
            fee: osmoFee,
            transactionGroupId: transactionGroup.id,
            userId: this.user.id
        }))
    })
}

    private async refundTransaction(data: RefundSinpePayload) {
        await this.manager.transaction('SERIALIZABLE', async entityManager => {
            const [userWallet,osmoFeeWallet] = await Promise.all([
                findAndLockWallet({entityManager: entityManager,coinId: this.coin.id,userId: this.user.id}),
                findAndLockWallet({entityManager: entityManager,coinId: this.coin.id,alias: MainWalletsAccount.FEES}),
            ])
            await Promise.all([
                entityManager.update(Wallet,userWallet.id, {
                    availableBalance: new Decimal(userWallet.availableBalance).plus(data.amount).toNumber(),
                    balance: new Decimal(userWallet.balance).plus(data.amount).toNumber()
                }),
                entityManager.update(Wallet,osmoFeeWallet.id, {
                    availableBalance: new Decimal(osmoFeeWallet.availableBalance).minus(data.amount).toNumber(),
                    balance: new Decimal(osmoFeeWallet.balance).minus(data.amount).toNumber()
                }),
                entityManager.update(TransactionGroup,data.transactionGroupId,{status: Status.FAILED})
            ])
        })
        this.pushNotificationService.sendPushToUser(this.user,{
            message: `Your Transaction could not be completed.`,
            title: 'Transaction Failed',
        })
    }


    private async validateInputData() {
        this.methodDto = await DynamicDtoValidator.validateInputData(this.body.data, SinpeWithdrawDto)
        const coin = await this.manager.findOneBy(Coin,{id: this.body.coinId})
        if(!coin) throw new BadRequestException('Invalid coin')
        this.coin = coin;
    }
}