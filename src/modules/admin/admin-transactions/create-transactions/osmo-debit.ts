import { BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import * as ln from 'lnurl';
import { ValidatorData } from 'src/common/dto_validators/validator-data';
import { Status } from 'src/common/enums/status.enum';
import { TransactionSubtype } from 'src/common/enums/transactionSubtype.enum';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { Coin } from 'src/entities/coin.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { User } from 'src/entities/user.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { IbexService } from 'src/modules/ibex/ibex.service';
import { CoinEnum } from 'src/modules/me/enums/coin.enum';
import { EntityManager } from 'typeorm';
import { CreateAdminTransactionDto, OsmoDebitDto } from '../dtos/create-transaction.dto';
import { AdminTransaction } from './create-transaction.interface';
import { findAndLockWallet } from 'src/common/utils/find-and-lock-wallet';
import { MainWalletsAccount } from 'src/common/enums/main-wallets.enum';

export class OsmoDebit implements AdminTransaction {
    private data: OsmoDebitDto;
    constructor(
        private manager: EntityManager,
        private createAdminTransactionDto: CreateAdminTransactionDto,
        private ibexService: IbexService,
    ) { }

    async validateData() {
        this.data = await ValidatorData.validate<OsmoDebitDto>(this.createAdminTransactionDto.data, OsmoDebitDto);
        const coin = await this.manager.findOneBy(Coin, { id: this.data.coinId });
        if (!coin) throw new BadRequestException('Invalid coin');
        const user = await this.manager.findOneBy(User, { id: this.data.userId });
        if (!user) throw new BadRequestException('Invalid user');
    }

    async create() {
        await this.validateData();
        const userIbexAccount = await this.manager.findOne(IbexAccount, {
            where: {
                user: { id: this.data.userId },
            },
        });

        const coin = await this.manager.findOneBy(Coin, { id: this.data.coinId });

        if (coin.acronym === CoinEnum.SATS) {
            const lnURLDecoded = ln.decode(process.env.IBEX_OSMO_LNURL_ADDRESS_PAYER);
            const params = await this.ibexService.getParams(lnURLDecoded);
            await this.ibexService.payLnURL(params, this.data.amount * 1000, userIbexAccount.account);
        }
        await this.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const [userWallet, osmoWallet] = await Promise.all([
                findAndLockWallet({entityManager: entityManager, coinId: this.data.coinId, userId: this.data.userId}),
                findAndLockWallet({entityManager: entityManager, coinId: this.data.coinId, alias: MainWalletsAccount.MAIN})
            ])

            await Promise.all([
                entityManager.update(Wallet, userWallet.id, {
                    availableBalance: new Decimal(userWallet.availableBalance).minus(this.data.amount).toNumber(),
                    balance: new Decimal(userWallet.balance).minus(this.data.amount).toNumber(),
                }),
                entityManager.update(Wallet, osmoWallet.id, {
                    availableBalance: new Decimal(osmoWallet.availableBalance).plus(this.data.amount).toNumber(),
                    balance: new Decimal(osmoWallet.balance).plus(this.data.amount).toNumber(),
                }),
            ]);
            const transactionGroup = entityManager.create(TransactionGroup, {
                toUser: { id: this.data.userId },
                transactionCoin: { id: coin.id },
                type: TransactionType.OSMO_DEBIT,
                status: Status.COMPLETED,
                metadata: {
                    display: this.data.display,
                    note: this.data?.note,
                },
            });
            await entityManager.insert(TransactionGroup, transactionGroup);
            const userTransaction = entityManager.create(Transaction, {
                amount: this.data.amount,
                wallet: { id: userWallet.id },
                balance: userWallet.availableBalance,
                transactionGroup: { id: transactionGroup.id },
                subtype: TransactionSubtype.DEBIT_FIAT_TRANSFER,
            });
            const osmoTransaction = entityManager.create(Transaction, {
                amount: this.data.amount,
                wallet: { id: osmoWallet.id },
                balance: osmoWallet.availableBalance,
                transactionGroup: { id: transactionGroup.id },
                subtype: TransactionSubtype.CREDIT_FIAT_TRANSFER,
            });
            await entityManager.insert(Transaction, [userTransaction, osmoTransaction]);
        });
    }
}
