import { EntityManager } from 'typeorm';
import { AdminTransaction } from './create-transaction.interface';
import { CreateAdminTransactionDto } from '../dtos/create-transaction.dto';
import { ValidatorData } from 'src/common/dto_validators/validator-data';
import { Coin } from 'src/entities/coin.entity';
import { BadRequestException } from '@nestjs/common';
import { CoinEnum } from 'src/modules/me/enums/coin.enum';
import { Wallet } from 'src/entities/wallet.entity';
import Decimal from 'decimal.js';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { TransactionSubtype } from 'src/common/enums/transactionSubtype.enum';
import { LiquidityTransactionDto } from '../dtos/liquidity-buy-sell.dto';
import { LiquidityTransaction } from './liquidity-transaction';

export class LiquidyBuy extends LiquidityTransaction implements AdminTransaction {
    constructor(
        protected manager: EntityManager,
        private createAdminTransaction: CreateAdminTransactionDto,
    ) {
        super();
    }

    async validateData(): Promise<void> {
        this.data = await ValidatorData.validate<LiquidityTransactionDto>(this.createAdminTransaction.data, LiquidityTransactionDto);
        const coin = await this.manager.findOne(Coin, { where: { id: this.data.fiat.coinId } });
        if (!coin) throw new BadRequestException('Invalid coin');
        if (coin.acronym == CoinEnum.SATS || coin.acronym == CoinEnum.USDT) throw new BadRequestException(`Invalid coin: ${coin.acronym}`);
    }

    async create(): Promise<void> {
        await this.validateData();
        await this.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const wallets = await entityManager.find(Wallet, {
                relations: { coin: true },
                where: {
                    account: {
                        alias: 'main',
                    },
                    coin: [
                        {
                            acronym: CoinEnum.SATS,
                        },
                        {
                            acronym: CoinEnum.USDT,
                        },
                        {
                            id: this.data.fiat.coinId,
                        },
                    ],
                },
                lock: { mode: 'pessimistic_write' },
            });

            const cryptoWallet = wallets.find((wallet) => wallet.coin.id == this.data.crypto.coinId);
            if (!cryptoWallet) throw new BadRequestException('Invalid wallet');

            let amountCryptoFee = new Decimal(this.data.crypto.fee);
            if (cryptoWallet.coin.acronym == CoinEnum.SATS) {
                const operationFee = new Decimal(amountCryptoFee).times(0.06);
                amountCryptoFee = new Decimal(amountCryptoFee).plus(operationFee);
            }
            const amountCryptoToCredit = new Decimal(this.data.crypto.amount).minus(amountCryptoFee);

            const wallet = wallets.find((wallet) => wallet.coin.id == this.data.fiat.coinId);
            if (!wallet) throw new BadRequestException('Invalid wallet');

            await entityManager.update(Wallet, wallet.id, {
                availableBalance: new Decimal(wallet.availableBalance).minus(this.data.fiat.amount).toNumber(),
                balance: new Decimal(wallet.balance).minus(this.data.fiat.amount).toNumber(),
            });

            await entityManager.update(Wallet, cryptoWallet.id, {
                availableBalance: new Decimal(cryptoWallet.availableBalance).plus(amountCryptoToCredit).toNumber(),
                balance: new Decimal(cryptoWallet.balance).plus(amountCryptoToCredit).toNumber(),
            });
            const transactionGroup = await this.createTransactionGroup(TransactionType.LIQUIDITY_BUY, entityManager);

            await this.createAndInsertTransaction(
                wallet,
                this.data.fiat.amount,
                wallet.availableBalance,
                TransactionSubtype.DEBIT_FIAT_BUY,
                transactionGroup.id,
                entityManager,
            );
            const cryptoSubtype: TransactionSubtype =
                cryptoWallet.coin.acronym == CoinEnum.SATS ? TransactionSubtype.CREDIT_BTC_BUY : TransactionSubtype.CREDIT_STABLE_OSMO;
            await this.createAndInsertTransaction(
                cryptoWallet,
                amountCryptoToCredit.toNumber(),
                cryptoWallet.availableBalance,
                cryptoSubtype,
                transactionGroup.id,
                entityManager,
            );
            await this.createAndInsertTransactionFee(amountCryptoFee.toNumber(), cryptoWallet.coin.id, transactionGroup.id, entityManager);
        });
    }
}
