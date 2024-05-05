import { Withdraw } from "./withdraw";
import { SendGridService } from "src/modules/send-grid/send-grid.service";
import { EntityManager } from "typeorm";
import { WithdrawDto } from "../dtos/withdraw.dto";
import { StableWithdrawDto } from "../dtos/stableWithdraw.dto";
import { BadRequestException } from "@nestjs/common";
import { BlockchainNetworkAddress } from "src/entities/userBlockchainNetworkAddress.entity";
import { CoinEnum } from "src/modules/me/enums/coin.enum";
import { Coin } from "src/entities/coin.entity";
import { Setting } from "src/entities/setting.entity";
import { TransactionType } from "src/common/enums/transactionsType.enum";
import { Wallet } from "src/entities/wallet.entity";
import { TransactionGroup } from "src/entities/transactionGroup.entity";
import { User } from "src/entities/user.entity";
import { TransactionFee } from "src/entities/transactionFee.entity";
import { Transaction } from "src/entities/transaction.entity";
import { WithdrawalPendingOsmoTemplate } from "src/modules/send-grid/templates/withdrawal/withdrawalPendingOsmo.template";
import { WithdrawalPendingTemplate } from "src/modules/send-grid/templates/withdrawal/withdrawalPending.template";
import Decimal from "decimal.js";
import { Status } from "src/common/enums/status.enum";
import { TransactionMethodEnum } from "src/common/enums/transactionMethod.enum";
import { DynamicDtoValidator } from "src/common/dto_validators/dynamic.validator";
import { TransactionSubtype } from "src/common/enums/transactionSubtype.enum";
import { RateType, getStableRate } from "src/common/utils/stable-rate.util";
import { findAndLockWallet } from "src/common/utils/find-and-lock-wallet";
import { MainWalletsAccount } from "src/common/enums/main-wallets.enum";
import { SlackService } from "src/services/slack/slack.service";
import { SlackWebhooks } from "src/services/slack/enums/slack-webhooks.enum";
import { createTransactionsTemplate } from "src/services/slack/templates/transactions.template";
import { SlackChannel } from "src/services/slack/enums/slack-channels.enum";
import { WithdrawalMethodEnum } from "../enums/withdrawalMethod.enum";
import { SlackEmoji } from "src/services/slack/enums/slack-emoji.enum";


export class StableWithdraw implements Withdraw {
    private coin: Coin
    private stableCoin: Coin
    private settings: Array<Setting>
    private blockChainNetworkAddress: BlockchainNetworkAddress
    private methodDto: StableWithdrawDto
    
    constructor(
        private sendgridService: SendGridService,
        private body: WithdrawDto,
        private manager: EntityManager,
        private user: User,
    ){}

    async withdraw(): Promise<any> {
        await this.validateInputData()
        await this.setDataToUse()
        const usdUpperRate = getStableRate(this.settings,RateType.UPPER,CoinEnum.USD)
        const fiatUpperRate = getStableRate(this.settings,RateType.UPPER,this.coin.acronym)
        const upperRate = new Decimal(this.coin.acronym == CoinEnum.USD ? usdUpperRate : fiatUpperRate);
        const lowerRate = new Decimal(this.coin.acronym == CoinEnum.USD ? new Decimal(1) : fiatUpperRate.dividedBy(usdUpperRate));

        let upperAmount, lowerAmount, fee;
        if (this.coin.acronym == CoinEnum.USD) {
            upperAmount = new Decimal(this.body.amount).mul(upperRate);
            lowerAmount = new Decimal(this.body.amount).mul(lowerRate);
            fee = new Decimal(upperAmount).minus(lowerAmount).times(lowerRate).abs().toFixed(2);
            lowerAmount = new Decimal(lowerAmount).minus(fee);
        } else {
            upperAmount = new Decimal(this.body.amount).div(lowerRate);
            lowerAmount = new Decimal(this.body.amount).div(upperRate);
            console.log(lowerAmount)
            fee = new Decimal(upperAmount).minus(lowerAmount).times(upperRate).abs().toFixed(2);
        }
        const amountToUserDebit = new Decimal(this.body.amount).toFixed(2);
        const osmoAmountToDebit = new Decimal(lowerAmount).toFixed(2);
        console.log('COIN---',this.coin.acronym)
        console.log('upperAmount',upperAmount)
        console.log('lowerAmount',lowerAmount)
        console.log('upperRate',upperRate)
        console.log('lowerRate',lowerRate)
        // console.log('upperAmount',upperAmount)
        // console.log('lowerAmount',lowerAmount)
        console.log('amountToUserDebit',amountToUserDebit)
        console.log('osmoAmount',osmoAmountToDebit)
        console.log('fee',fee)
        
        await this.manager.transaction('SERIALIZABLE',async transactionalEntityManager => {
            const [userWallet,osmoWallet,osmoFeeWallet] = await Promise.all([
                findAndLockWallet({entityManager: transactionalEntityManager,coinId: this.coin.id, userId: this.user.id}),
                findAndLockWallet({entityManager: transactionalEntityManager,coinId: this.stableCoin.id,alias: MainWalletsAccount.MAIN}),
                findAndLockWallet({entityManager: transactionalEntityManager,coinId: this.coin.id,alias: MainWalletsAccount.FEES}),
            ])
            if(userWallet.availableBalance < parseFloat(amountToUserDebit)) throw new BadRequestException('Insufficient balance')
            
            const newAvailableBalance = new Decimal(userWallet.availableBalance).minus(amountToUserDebit).toNumber();
            await transactionalEntityManager.update(Wallet, userWallet.id, { availableBalance: newAvailableBalance });

            const transactionGroup = transactionalEntityManager.create(TransactionGroup,{
                status: Status.PENDING,
                type: TransactionType.WITHDRAW,
                method: TransactionMethodEnum.STABLE_COIN,
                fromUser: this.user,
                transactionCoin: this.coin,
                metadata: {
                    network: this.blockChainNetworkAddress,
                    address: this.blockChainNetworkAddress.address,
                    stableCoin: this.methodDto.stableCoin
                }
            })
            await transactionalEntityManager.insert(TransactionGroup,transactionGroup)
            const userTransaction = transactionalEntityManager.create(Transaction,{
                subtype: TransactionSubtype.DEBIT_FIAT_WITHDRAW,
                amount: parseFloat(amountToUserDebit),
                balance: userWallet.availableBalance,
                transactionGroup: transactionGroup,
                wallet: userWallet,
            })

            const osmoTransaction = transactionalEntityManager.create(Transaction,{
                subtype: TransactionSubtype.DEBIT_STABLE_OSMO,
                amount: parseFloat(osmoAmountToDebit),
                balance: osmoWallet.availableBalance,
                transactionGroup: transactionGroup,
                wallet: osmoWallet,
            })

            const feeTransaction = transactionalEntityManager.create(Transaction,{
                subtype: TransactionSubtype.FEE_WITHDRAW,
                amount: parseFloat(fee),
                balance: osmoFeeWallet.availableBalance,
                transactionGroup: transactionGroup,
                wallet: osmoFeeWallet,
            })
            const feeRecord = transactionalEntityManager.create(TransactionFee, {
                amount: parseFloat(fee),
                coin: this.coin,
                transactionGroup: transactionGroup
            })
            await transactionalEntityManager.insert(Transaction,[userTransaction,osmoTransaction,feeTransaction])
            await transactionalEntityManager.insert(TransactionFee,feeRecord)
            this.notify(transactionGroup,this.user,parseFloat(amountToUserDebit))
        })

        SlackService.notifyTransaction({ 
            baseURL: SlackWebhooks.TRANSACTIONS_STABLE_COINS, 
            data: createTransactionsTemplate({ 
              channel: SlackChannel.TRANSACTIONS_STABLE_COINS, 
              amount: this.body.amount, 
              coin: CoinEnum[this.coin.acronym],
              firstName: this.user.firstName, 
              lastName: this.user.lastName, 
              email: this.user.email, 
              transactionType: {
                name: WithdrawalMethodEnum.STABLE_COIN,
                emoji: SlackEmoji.COIN
              }, 
              attachmentUrl: "https://firebasestorage.googleapis.com/v0/b/osmowallet.appspot.com/o/logo_cuadrado.png?alt=media&token=955446df-d591-484c-986f-1211a14dad98"
            }) 
        })
    }

    private async setDataToUse() {
        const [stableCoin,settings] = await Promise.all([
            this.manager.findOneBy(Coin,{acronym: 'USDT'}),
            this.manager.find(Setting)
        ])
        this.stableCoin = stableCoin
        this.settings = settings
    }


    private async validateInputData() {
        this.methodDto = await DynamicDtoValidator.validateInputData(this.body.data, StableWithdrawDto)
        const blockChainNetworkAddress = await this.manager.findOne(BlockchainNetworkAddress,{
            relations: {
                network: true
            },
            where: {
                id: this.methodDto.networkAddressId
            }
        })
        if(!blockChainNetworkAddress) throw new BadRequestException('Invalid network')
        const coin = await this.manager.findOneBy(Coin,{id: this.body.coinId})
        if(!coin) throw new BadRequestException('Invalid coin')
        if(coin.acronym == CoinEnum.SATS) throw new BadRequestException('Invalid coin')
        if(!['USD','GTQ','CRC'].includes(coin.acronym)) throw new BadRequestException('Invalid coin')
        this.coin = coin
        this.blockChainNetworkAddress = blockChainNetworkAddress
    }

    private notify(
        transactionGroup: TransactionGroup, 
        user: User,    
        amount: number    
        ){
        const emails = process.env.ENV == 'PROD' 
        ? [{email: 'victor@osmowallet.com',name: 'Victor'},{email: 'piero@osmowallet.com',name: 'Piero'}] 
        : [{email: 'as@singularagency.co',name: 'Piero'}]
        const template = new WithdrawalPendingOsmoTemplate(
            emails,
            user.firstName + ' ' + user.lastName,
            user.email,
            {
                amount: this.body.amount,currency: this.coin.acronym,
                date: (new Date()).toDateString(),
                status: Status.PENDING,
                transactionId: transactionGroup.id
            }
        )
        const confirmationUserTemplate = new WithdrawalPendingTemplate(
            [{email: user.email, name: user.firstName}],
            {
            amount: amount,
            currency: this.coin.acronym, 
            date: (new Date()).toDateString(),
            status: Status.PENDING,
            transactionId: transactionGroup.id
            },
        )
        this.sendgridService.sendMail(confirmationUserTemplate)
        this.sendgridService.sendMail(template)
    }
    
}