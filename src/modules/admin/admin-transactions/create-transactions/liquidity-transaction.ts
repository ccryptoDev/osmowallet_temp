import { Status } from 'src/common/enums/status.enum';
import { TransactionSubtype } from 'src/common/enums/transactionSubtype.enum';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { Transaction } from 'src/entities/transaction.entity';
import { TransactionFee } from 'src/entities/transactionFee.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { EntityManager } from 'typeorm';
import { LiquidityTransactionDto } from '../dtos/liquidity-buy-sell.dto';

export abstract class LiquidityTransaction {
    protected data!: LiquidityTransactionDto;

    async createTransactionGroup(type: TransactionType, entityManager: EntityManager): Promise<TransactionGroup> {
        const transactionGroup = entityManager.create(TransactionGroup, {
            status: Status.COMPLETED,
            type: type,
            transactionCoin: { id: this.data.crypto.coinId },
        });
        await entityManager.insert(TransactionGroup, transactionGroup);
        return transactionGroup;
    }

    async createAndInsertTransaction(
        wallet: Wallet,
        amount: number,
        balance: number,
        subtype: TransactionSubtype,
        transactionGroupId: string,
        entityManager: EntityManager,
    ): Promise<void> {
        const transaction = entityManager.create(Transaction, {
            amount: amount,
            balance: balance,
            transactionGroup: { id: transactionGroupId },
            wallet: { id: wallet.id },
            subtype: subtype,
        });
        await entityManager.insert(Transaction, transaction);
    }

    async createAndInsertTransactionFee(
        amount: number,
        coinId: string,
        transactionGroupId: string,
        entityManager: EntityManager,
    ): Promise<void> {
        const transactionFee = entityManager.create(TransactionFee, {
            amount: amount,
            coin: { id: coinId },
            transactionGroup: { id: transactionGroupId },
        });
        await entityManager.insert(TransactionFee, transactionFee);
    }
}
