import { Coin } from "src/entities/coin.entity";
import { Transaction } from "src/entities/transaction.entity";
import { TransactionGroup } from "src/entities/transactionGroup.entity";
import { User } from "src/entities/user.entity";
import { Wallet } from "src/entities/wallet.entity";
import { SendFiatDto } from "../../dtos/sendFiat.dto";
import { SendFiat } from "./interfaceSendFiat";
import { BadRequestException} from '@nestjs/common';
import { EntityManager } from "typeorm";
import { TransactionType } from "src/common/enums/transactionsType.enum";
import { Status } from "src/common/enums/status.enum";
import MobileRoutePaths from "src/modules/push-notification/enums/mobileRoutesPaths.enum";
import { PushNotificationService } from "src/modules/push-notification/push-notification.service";
import Decimal from "decimal.js";
import { TransactionSubtype } from "src/common/enums/transactionSubtype.enum";
import { GoogleCloudTasksService } from "src/services/google-cloud-tasks/google-cloud-tasks.service";
import { BalanceUpdaterService } from "src/modules/balance-updater/balance-updater.service";
import { UpdateBalance } from "src/modules/balance-updater/interfaces/updateBalance";
import { UpdateBalanceTransferType } from "src/modules/balance-updater/enums/type.enum";
import { findAndLockWallet } from "src/common/utils/find-and-lock-wallet";


export class NormalSendFiat implements SendFiat{
   
    constructor(
        private manager: EntityManager,
        private userId: string,
        private data: SendFiatDto,
        private pushNotificationService: PushNotificationService,
        private googleTasksService: GoogleCloudTasksService
    ){}

    async sendFiat(): Promise<boolean> {
        const [coin, fromUser, toUser] = await Promise.all([
            this.manager.findOneBy(Coin,{id: this.data.coinId}),
            this.manager.findOneBy(User,{id: this.userId}),
            this.manager.findOneBy(User,{id: this.data.receiverId}),
        ])
        
        if(!toUser || fromUser.id == toUser.id) throw new BadRequestException('Invalid user')
        if(!coin) throw new BadRequestException('Invalid coin')
        
        await this.manager.transaction('SERIALIZABLE',async entityManager => {
            const [userWallet, receiverWallet] = await Promise.all([
                findAndLockWallet({entityManager: entityManager, coinId: this.data.coinId, userId: this.userId}),
                findAndLockWallet({entityManager: entityManager, coinId: this.data.coinId, userId: this.data.receiverId}),
            ])
                 
            if(userWallet.availableBalance < this.data.amount) throw new BadRequestException('Insufficient balance')
            //Debit to current user
            const transactionGroup = entityManager.create(TransactionGroup,{
                fromUser: {id: fromUser.id},
                toUser: {id: toUser.id},
                type: TransactionType.TRANSACTION,
                status: Status.COMPLETED,
                note: this.data.note,
                transactionCoin: {id: this.data.coinId}
            })
            await Promise.all([
                entityManager.update(Wallet, userWallet.id, {
                    availableBalance: new Decimal(userWallet.availableBalance).minus(this.data.amount).toNumber(),
                    balance: new Decimal(userWallet.balance).minus(this.data.amount).toNumber()
                }),
                entityManager.update(Wallet, receiverWallet.id, {
                    availableBalance: new Decimal(receiverWallet.availableBalance).plus(this.data.amount).toNumber(),
                    balance: new Decimal(receiverWallet.balance).plus(this.data.amount).toNumber()
                }),
                entityManager.insert(TransactionGroup,[transactionGroup])
            ])
            
            const userTransaction =  entityManager.create(Transaction,{
                amount: this.data.amount,
                transactionGroup: transactionGroup,
                wallet: userWallet,
                balance: userWallet.availableBalance,
                subtype: TransactionSubtype.DEBIT_FIAT_WITHDRAW
            })
            const receiverTransaction = entityManager.create(Transaction,{
                amount: this.data.amount,
                transactionGroup: transactionGroup,
                wallet: receiverWallet,
                subtype: TransactionSubtype.CREDIT_FIAT_TRANSFER,
                balance: receiverWallet.availableBalance
            })
            
            await entityManager.insert(Transaction,[userTransaction,receiverTransaction])
             
           this.pushNotificationService.sendPushToUser(toUser,{
             title: 'Recepción',
             message: `Hey! ${fromUser.firstName} te ha enviado ${this.data.amount} ${coin.acronym}`,
             data: {
                route: MobileRoutePaths.Transactions,
                currency: coin.acronym,
                amount: this.data.amount.toString()
             }
           })
        })
        const fromUserBalanceUpdatePayload: UpdateBalance = {
            amount: this.data.amount,
            coinId: this.data.coinId,
            type: UpdateBalanceTransferType.USER_TO_OSMO,
            userId: fromUser.id
        } 
        const toUserBalanceUpdatePayload: UpdateBalance = {
            amount: this.data.amount,
            coinId: this.data.coinId,
            type: UpdateBalanceTransferType.OSMO_TO_USER,
            userId: toUser.id
        } 
        this.googleTasksService.createInternalTask(BalanceUpdaterService.queue,fromUserBalanceUpdatePayload,BalanceUpdaterService.url)
        this.googleTasksService.createInternalTask(BalanceUpdaterService.queue,toUserBalanceUpdatePayload,BalanceUpdaterService.url)
        return true;
    }

}