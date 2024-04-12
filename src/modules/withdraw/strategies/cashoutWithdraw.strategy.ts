import { BadRequestException } from "@nestjs/common/exceptions";
import lightningPayReq from 'bolt11';
import Decimal from "decimal.js";
import { Status } from "src/common/enums/status.enum";
import { TransactionMethodEnum } from "src/common/enums/transactionMethod.enum";
import { TransactionSubtype } from "src/common/enums/transactionSubtype.enum";
import { TransactionType } from "src/common/enums/transactionsType.enum";
import { Coin } from "src/entities/coin.entity";
import { IbexAccount } from "src/entities/ibex.account.entity";
import { OsmoBusinessBpt } from "src/entities/osmoBusinessBPT.entity";
import { TransactionDetail } from "src/entities/transaction.detail.entity";
import { Transaction } from "src/entities/transaction.entity";
import { TransactionFee } from "src/entities/transactionFee.entity";
import { TransactionGroup } from "src/entities/transactionGroup.entity";
import { Wallet } from "src/entities/wallet.entity";
import { IbexService } from "src/modules/ibex/ibex.service";
import { CoinEnum } from "src/modules/me/enums/coin.enum";
import { GoogleCloudTasksService } from "src/services/google-cloud-tasks/google-cloud-tasks.service";
import { EntityManager } from "typeorm";
import { v4 as uuidv4 } from 'uuid';
import { CashoutWithdrawDto } from "../dtos/cashoutWithdraw.dto";
import { CashOutPayload } from "../interfaces/cashout.payload";
import { Withdraw } from "./withdraw";
import { findAndLockWallet } from "src/common/utils/find-and-lock-wallet";
import { MainWalletsAccount } from "src/common/enums/main-wallets.enum";
import { SlackService } from "src/services/slack/slack.service";
import { SlackWebhooks } from "src/services/slack/enums/slack-webhooks.enum";
import { createTransactionsTemplate } from "src/services/slack/templates/transactions.template";
import { SlackChannel } from "src/services/slack/enums/slack-channels.enum";
import { WithdrawalMethodEnum } from "../enums/withdrawalMethod.enum";
import { SlackEmoji } from "src/services/slack/enums/slack-emoji.enum";
import { User } from "src/entities/user.entity";


export class CashoutWithdraw implements Withdraw{
    private queue = `CASHOUT-${process.env.ENV}`
    private url = `https://${process.env.DOMAIN}/withdraw/cashout/create-transaction`
    constructor(
        private userId: string,
        private data: CashoutWithdrawDto,
        private manager: EntityManager,
        private ibexService: IbexService,
        private queueService: GoogleCloudTasksService
        ){}

    async withdraw() {
        const btcPrice = this.data.btcPrice
        const gtqCoinRate = await this.ibexService.getBtcExchangeRate(false)
        const lnAddressDecoded = lightningPayReq.decode(this.data.address)
        const amountSats = lnAddressDecoded.satoshis
        const satCoin = await this.manager.findOneBy(Coin,{acronym: CoinEnum.SATS})
        const gtqCoin = await this.manager.findOneBy(Coin, {acronym: CoinEnum.GTQ})
        await this.manager.transaction('SERIALIZABLE',async transactionalEntityManager => {
            const wallet = await findAndLockWallet({entityManager: transactionalEntityManager, coinId: satCoin.id,userId: this.userId})
            if(wallet.availableBalance < amountSats) {
                throw new BadRequestException('Insufficient balance');
            }
            const osmoWalletFee = await findAndLockWallet({entityManager: transactionalEntityManager, coinId:gtqCoin.id, alias: MainWalletsAccount.FEES})
            const satsToBtc = new Decimal(amountSats).dividedBy(Math.pow(10,8))
            const usdAmount = new Decimal(btcPrice).times(satsToBtc)
            const gtqAmount = new Decimal(usdAmount).times(gtqCoinRate.rate)
            let feeAmount = new Decimal( new Decimal(gtqAmount).times(0.05).toFixed(2))
            if(gtqAmount.greaterThan(800)){
                feeAmount = new Decimal(40)
            }
            await Promise.all([
                transactionalEntityManager.update(Wallet, wallet.id, {
                    availableBalance: new Decimal(wallet.availableBalance).minus(amountSats).toNumber(),
                    balance: new Decimal(wallet.balance).minus(amountSats).toNumber()
                }),
                transactionalEntityManager.update(Wallet, osmoWalletFee.id, {
                    availableBalance: new Decimal(osmoWalletFee.availableBalance).plus(feeAmount).toNumber(),
                    balance: new Decimal(osmoWalletFee.balance).plus(feeAmount).toNumber()
                })
            ]);
            const body: CashOutPayload = {
                id: uuidv4(),
                amounts: {
                    osmoFiatFeeToCredit: feeAmount.toNumber(),
                    totalUserBtcToDebit: amountSats,
                    totalUserFiatToDebit: 0
                },
                balances: {
                    osmoWalletFeeBalance: osmoWalletFee.availableBalance,
                    userSatsBalance: wallet.availableBalance,
                    userFiatBalance: 0,
                },
                btcPrice: this.data.btcPrice,
                gtqRate: gtqCoinRate.rate,
                user: {sub: this.userId},
                payload: this.data,
                wallets: {
                    osmoFeeWallet: osmoWalletFee.id,
                    userSatsWallet: wallet.id,
                }
            }
            this.queueService.createInternalTask(this.queue,body,this.url)
        });

        const user = await this.manager.findOne(User, {where: {id: this.userId}})

        SlackService.notifyTransaction({ 
            baseURL: SlackWebhooks.OSMO_WITHDRAW, 
            data: createTransactionsTemplate({ 
              channel: SlackChannel.OSMO_WITHDRAW, 
              amount: amountSats, 
              coin: CoinEnum.SATS,
              firstName: user.firstName, 
              lastName: user.lastName, 
              email: user.email, 
              transactionType: {
                name: WithdrawalMethodEnum.CASH_OUT,
                emoji: SlackEmoji.BITCOIN
              }, 
              attachmentUrl: "https://firebasestorage.googleapis.com/v0/b/osmowallet.appspot.com/o/logo_cuadrado.png?alt=media&token=955446df-d591-484c-986f-1211a14dad98"
            }) 
        })
    }

    async createTransaction(data: CashOutPayload) {
        const ibexAccount = await this.manager.findOneBy(IbexAccount,{user: {id: this.userId}})
        await this.ibexService.doCashout(data.payload.address,ibexAccount.account,data.amounts.totalUserBtcToDebit)
        const invoice = await this.ibexService.getInvoiceFromBolt11(data.payload.address.toLowerCase())
        let osmoBusiness: OsmoBusinessBpt = null
        if(invoice){
            osmoBusiness = await this.manager.findOneBy(OsmoBusinessBpt,{bptName: invoice.memo})
        }
        const [gtqCoin] = await Promise.all([
            this.manager.findOneBy(Coin,{acronym: CoinEnum.GTQ}),
            
        ])
        await this.manager.transaction(async transactionalEntityManager => {
            const transactionGroup = transactionalEntityManager.create(TransactionGroup, {
                fromUser: {id: data.user.sub},
                transactionCoin: {id: gtqCoin.id},
                type: TransactionType.CASHOUT,
                method: TransactionMethodEnum.CASH_OUT,
                status: Status.COMPLETED,
                osmoBusiness: osmoBusiness,
                btcPrice: data.btcPrice,
                metadata: {
                    gtqRate: data.gtqRate
                }
            })
            await transactionalEntityManager.insert(TransactionGroup,transactionGroup)
            const transactionRecord = transactionalEntityManager.create(Transaction,{
                transactionGroup: transactionGroup,
                amount: data.amounts.totalUserBtcToDebit,
                wallet: {id: data.wallets.userSatsWallet},
                balance: data.balances.userSatsBalance,
                subtype: TransactionSubtype.DEBIT_BTC_WITHDRAW_CASHOUT,
            })
            
            const osmoTransactionRecordFee = transactionalEntityManager.create(Transaction,{
                transactionGroup: transactionGroup,
                amount: data.amounts.osmoFiatFeeToCredit,
                wallet: {id: data.wallets.osmoFeeWallet},
                balance: data.balances.osmoWalletFeeBalance,
                subtype: TransactionSubtype.FEE_WITHDRAW,
            })
            await transactionalEntityManager.insert(Transaction,[transactionRecord,osmoTransactionRecordFee])

            const transactionDetailRecord = transactionalEntityManager.create(TransactionDetail,{
                transaction: transactionRecord,
                address: data.payload.address.toLowerCase()
            })
            await transactionalEntityManager.insert(TransactionDetail,transactionDetailRecord)
            const osmoFee = transactionalEntityManager.create(TransactionFee,{
                coin: gtqCoin,
                amount: data.amounts.osmoFiatFeeToCredit,
                transactionGroup: transactionGroup
            })
            await transactionalEntityManager.insert(TransactionFee,osmoFee)
        })
    }

    
}