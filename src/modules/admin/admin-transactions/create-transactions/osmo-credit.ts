import { BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import * as ln from 'lnurl';
import { ValidatorData } from 'src/common/dto_validators/validator-data';
import { Status } from 'src/common/enums/status.enum';
import { TransactionSubtype } from 'src/common/enums/transactionSubtype.enum';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { Address } from 'src/entities/address.entity';
import { Coin } from 'src/entities/coin.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { User } from 'src/entities/user.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { IbexService } from 'src/modules/ibex/ibex.service';
import { CoinEnum } from 'src/modules/me/enums/coin.enum';
import { EntityManager } from 'typeorm';
import { CreateAdminTransactionDto, OsmoCreditDto } from '../dtos/create-transaction.dto';
import { AdminTransaction } from './create-transaction.interface';
import { findAndLockWallet } from 'src/common/utils/find-and-lock-wallet';
import { MainWalletsAccount } from 'src/common/enums/main-wallets.enum';
export class OsmoCredit implements AdminTransaction {
    private data: OsmoCreditDto;
    constructor(
        private manager: EntityManager,
        private createAdminTransactionDto: CreateAdminTransactionDto,
        private ibexService: IbexService,
    ) { }

    async validateData() {
        this.data = await ValidatorData.validate<OsmoCreditDto>(this.createAdminTransactionDto.data, OsmoCreditDto);
        const coin = await this.manager.findOneBy(Coin, { id: this.data.coinId });
        if (!coin) throw new BadRequestException('Invalid coin');
        const user = await this.manager.findOneBy(User, { id: this.data.userId });
        if (!user) throw new BadRequestException('Invalid user');
    }

    async create() {
        await this.validateData();
        const addresses = await this.manager.findOne(Address, {
            where: {
                user: { id: this.data.userId },
            },
        });
        
        const coin = await this.manager.findOneBy(Coin, { id: this.data.coinId });

        if (coin.acronym === CoinEnum.SATS) {
            const lnURLDecoded = ln.decode(addresses.lnUrlPayer);
            const params = await this.ibexService.getParams(lnURLDecoded);
            await this.ibexService.payLnURL(params, this.data.amount * 1000, process.env.IBEX_NATIVE_OSMO_ACCOUNT_ID);
        }
        await this.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const [userWallet, osmoWallet] = await Promise.all([
                findAndLockWallet({entityManager: entityManager, coinId: this.data.coinId, userId: this.data.userId}),
                findAndLockWallet({entityManager: entityManager, coinId: this.data.coinId, alias: MainWalletsAccount.MAIN})
            ])

            await Promise.allSettled([
                entityManager.update(Wallet, userWallet.id, {
                    availableBalance: new Decimal(userWallet.availableBalance).plus(this.data.amount).toNumber(),
                    balance: new Decimal(userWallet.balance).plus(this.data.amount).toNumber(),
                }),
                entityManager.update(Wallet, osmoWallet.id, {
                    availableBalance: new Decimal(osmoWallet.availableBalance).minus(this.data.amount).toNumber(),
                    balance: new Decimal(osmoWallet.balance).minus(this.data.amount).toNumber(),
                }),
            ]);
            const transactionGroup = entityManager.create(TransactionGroup, {
                toUser: { id: this.data.userId },
                transactionCoin: { id: this.data.coinId },
                type: TransactionType.OSMO_CREDIT,
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
                subtype: TransactionSubtype.CREDIT_FIAT_TRANSFER,
            });
            const osmoTransaction = entityManager.create(Transaction, {
                amount: this.data.amount,
                wallet: { id: osmoWallet.id },
                balance: osmoWallet.availableBalance,
                transactionGroup: { id: transactionGroup.id },
                subtype: TransactionSubtype.DEBIT_FIAT_TRANSFER,
            });
            await entityManager.insert(Transaction, [userTransaction, osmoTransaction]);
        });
    }
}
