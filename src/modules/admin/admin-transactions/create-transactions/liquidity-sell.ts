import { EntityManager } from "typeorm";
import { AdminTransaction } from "./create-transaction.interface";
import { ValidatorData } from "src/common/dto_validators/validator-data";
import { CreateAdminTransactionDto } from "../dtos/create-transaction.dto";
import { Coin } from "src/entities/coin.entity";
import { BadRequestException } from "@nestjs/common";
import { CoinEnum } from "src/modules/me/enums/coin.enum";
import { Wallet } from "src/entities/wallet.entity";
import Decimal from "decimal.js";
import { TransactionType } from "src/common/enums/transactionsType.enum";
import { TransactionSubtype } from "src/common/enums/transactionSubtype.enum";
import { LiquidityTransactionDto } from "../dtos/liquidity-buy-sell.dto";
import { LiquidityTransaction } from "./liquidity-transaction";


export class LiquiditySell extends LiquidityTransaction implements AdminTransaction{
    constructor(
        protected manager: EntityManager,
        private createAdminTransactionDto: CreateAdminTransactionDto,
    ){
        super();
    }

    async validateData(): Promise<void> {
        this.data = await ValidatorData.validate<LiquidityTransactionDto>(this.createAdminTransactionDto.data,LiquidityTransactionDto)
        const coins = await this.manager.findOne(Coin,{where: {id: this.data.fiat.coinId}})
        if(!coins) throw new BadRequestException('Invalid coin')
        if(coins.acronym === CoinEnum.SATS || coins.acronym === CoinEnum.USDT) {
            throw new BadRequestException(`Invalid coin: ${coins.acronym}`);
        }
    }

    async create(): Promise<void> {
        console.log('nada')
        await this.validateData()
        console.log('2')

        await this.manager.transaction('SERIALIZABLE', async entityManager => {
            const wallets = await entityManager.find(Wallet,{
                relations: {coin: true},
                where: {
                    account: {
                        alias: 'main'
                    },
                    coin: [
                        {
                            acronym: CoinEnum.SATS
                        },
                        {
                            acronym: CoinEnum.USDT
                        },
                        {
                            id: this.data.fiat.coinId
                        }
                    ]
                },
                lock: {mode: 'pessimistic_write'}
            })
            const cryptoWallet = wallets.find(wallet => wallet.coin.id == this.data.crypto.coinId)

            let amountCryptoFee = new Decimal(this.data.crypto.fee)
            if(cryptoWallet.coin.acronym == CoinEnum.SATS){
                const operationFee = new Decimal(amountCryptoFee).times(0.06)
                amountCryptoFee = new Decimal(amountCryptoFee).plus(operationFee)
            }
            const amountCryptoToDebit = new Decimal(this.data.crypto.amount).plus(amountCryptoFee)

            const wallet = wallets.find(wallet => wallet.coin.id == this.data.fiat.coinId);
            await entityManager.update(Wallet, wallet.id, {
                availableBalance: new Decimal(wallet.availableBalance).plus(this.data.fiat.amount).toNumber(),
                balance: new Decimal(wallet.balance).plus(this.data.fiat.amount).toNumber()
            });
            await entityManager.update(Wallet, cryptoWallet.id, {
                availableBalance: new Decimal(cryptoWallet.availableBalance).minus(amountCryptoToDebit).toNumber(),
                balance: new Decimal(cryptoWallet.balance).minus(amountCryptoToDebit).toNumber()
            });
            const transactionGroup = await this.createTransactionGroup(TransactionType.LIQUIDITY_SELL,entityManager)
            
            await this.createAndInsertTransaction(wallet,this.data.fiat.amount,wallet.availableBalance, TransactionSubtype.CREDIT_FIAT_SELL,transactionGroup.id,entityManager)
            const cryptoSubtype: TransactionSubtype = cryptoWallet.coin.acronym == CoinEnum.SATS ? TransactionSubtype.DEBIT_BTC_SELL : TransactionSubtype.DEBIT_STABLE_OSMO

            await this.createAndInsertTransaction(cryptoWallet,amountCryptoToDebit.toNumber(),cryptoWallet.availableBalance, cryptoSubtype,transactionGroup.id,entityManager)
            await this.createAndInsertTransactionFee(amountCryptoFee.toNumber(),cryptoWallet.coin.id,transactionGroup.id,entityManager)

        })
    }

}