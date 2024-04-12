import { BadRequestException } from "@nestjs/common";
import Decimal from "decimal.js";
import { Partner } from "src/common/enums/partner.enum";
import { Status } from "src/common/enums/status.enum";
import { TransactionMethodEnum } from "src/common/enums/transactionMethod.enum";
import { TransactionSubtype } from "src/common/enums/transactionSubtype.enum";
import { TransactionType } from "src/common/enums/transactionsType.enum";
import { Coin } from "src/entities/coin.entity";
import { Transaction } from "src/entities/transaction.entity";
import { TransactionGroup } from "src/entities/transactionGroup.entity";
import { User } from "src/entities/user.entity";
import { SendGridService } from "src/modules/send-grid/send-grid.service";
import { WithdrawalPendingTemplate } from "src/modules/send-grid/templates/withdrawal/withdrawalPending.template";
import { WithdrawalPendingOsmoTemplate } from "src/modules/send-grid/templates/withdrawal/withdrawalPendingOsmo.template";
import { PartnerInvoice } from "src/schemas/partnerInvoice.schema";
import { EntityManager } from "typeorm";
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
import { Model } from "mongoose";
import { Wallet } from "src/entities/wallet.entity";


export class PartnerWithdraw implements Withdraw {
    
    constructor(
        private partnerModel: Model<PartnerInvoice>,
        private partnerInvoice: PartnerInvoice,
        private sendGridService: SendGridService,
        private manager: EntityManager,
        private user: User
    ){}
    
    
    async withdraw(): Promise<void> {
        const amountToWithdraw = this.partnerInvoice.targetAmount.amount
        const feePercent = 0
        const [user, coin] = await Promise.all([
            this.manager.findOneBy(User,{id: this.user.id}),
            this.manager.findOneBy(Coin,{acronym: this.partnerInvoice.targetAmount.currency})
        ])
        let transactionGroup: TransactionGroup
        await this.manager.transaction('SERIALIZABLE', async (transactionManager) => {
            const [wallet, osmoWallet, osmoWalletFee] = await Promise.all([
                findAndLockWallet({entityManager: transactionManager,coinId: coin.id,userId: this.user.id}),
                findAndLockWallet({entityManager: transactionManager,coinId: coin.id,alias: MainWalletsAccount.MAIN}),
                findAndLockWallet({entityManager: transactionManager,coinId: coin.id,alias: MainWalletsAccount.FEES}),
            ])
            if(wallet.availableBalance < amountToWithdraw) throw new BadRequestException('Insufficient balance')
            if(osmoWallet.availableBalance < amountToWithdraw) throw new BadRequestException('Insufficient balance')
            const newAvailableBalance = new Decimal(wallet.availableBalance).minus(amountToWithdraw).toNumber();
            const fee = new Decimal(amountToWithdraw).mul(feePercent).toNumber();
            await transactionManager.update(Wallet, wallet.id, { availableBalance: newAvailableBalance });
            transactionGroup = transactionManager.create(TransactionGroup,{
                status: Status.PENDING,
                fromUser: user,
                transactionCoin: coin,
                type: TransactionType.WITHDRAW,
                method: TransactionMethodEnum.TRANSFER,
                partner: Partner.STRIKE,
                metadata: {
                    bankAddress: this.partnerInvoice.bankAccount
                }
            })
            await transactionManager.save(TransactionGroup,transactionGroup,{reload: true})
            
            const osmoDebitTransaction = transactionManager.create(Transaction,{
                amount: amountToWithdraw,
                transactionGroup: transactionGroup,
                wallet: osmoWallet,
                subtype: TransactionSubtype.DEBIT_FIAT_WITHDRAW_OSMO,
                balance: osmoWallet.availableBalance
            })

            const osmoFeeTransaction = transactionManager.create(Transaction,{
                amount: fee,
                transactionGroup: transactionGroup,
                wallet: osmoWalletFee,
                subtype: TransactionSubtype.FEE_WITHDRAW,
                balance: osmoWalletFee.availableBalance
            })

            const transactionRecord = transactionManager.create(Transaction,{
                transactionGroup: transactionGroup,
                amount: amountToWithdraw,
                wallet: wallet,
                subtype: TransactionSubtype.DEBIT_FIAT_WITHDRAW,
                balance: wallet.availableBalance,
            })
            await transactionManager.insert(Transaction,[transactionRecord,osmoFeeTransaction,osmoDebitTransaction])
            this.notify(this.user, transactionGroup)
        })
        await this.partnerModel.findOneAndUpdate(
            {referenceId: this.partnerInvoice.referenceId},
            {transactionId: transactionGroup.id},
        );
        SlackService.notifyTransaction({ 
            baseURL: SlackWebhooks.OSMO_WITHDRAW, 
            data: createTransactionsTemplate({ 
              channel: SlackChannel.OSMO_WITHDRAW, 
              amount: amountToWithdraw, 
              coin: CoinEnum[coin.acronym],
              firstName: user.firstName, 
              lastName: user.lastName, 
              email: user.email, 
              transactionType: {
                name: WithdrawalMethodEnum.CASH_OUT,
                emoji: SlackEmoji.ATM
              }, 
              attachmentUrl: "https://firebasestorage.googleapis.com/v0/b/osmowallet.appspot.com/o/logo_cuadrado.png?alt=media&token=955446df-d591-484c-986f-1211a14dad98" 
            }) 
        })
    }

    private notify(user: User, transactionGroup: TransactionGroup) {
        const emails = process.env.ENV == 'PROD' 
        ? [{email: 'victor@osmowallet.com',name: 'Victor'},{email: 'piero@osmowallet.com',name: 'Piero'}] 
        : [{email: 'as@singularagency.co',name: 'Piero'}]
        const date = new Date()
        const osmoTemplate = new WithdrawalPendingOsmoTemplate(
            emails,
            user.firstName + ' '+ user.lastName,
            user.email,
            {amount: this.partnerInvoice.targetAmount.amount, currency: this.partnerInvoice.targetAmount.currency,date: formatDateToSpanish(date),status: Status.PENDING,transactionId: transactionGroup.id}
            )
        const template = new WithdrawalPendingTemplate(
            [{email: user.email,name: user.firstName},],
            {amount: this.partnerInvoice.targetAmount.amount, currency: this.partnerInvoice.targetAmount.currency, date: formatDateToSpanish(date),status: Status.PENDING,transactionId: transactionGroup.id}
            )
        this.sendGridService.sendMail(osmoTemplate)
        this.sendGridService.sendMail(template)
    }

}