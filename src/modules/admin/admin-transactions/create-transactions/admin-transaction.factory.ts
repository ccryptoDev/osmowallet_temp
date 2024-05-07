import { IbexService } from 'src/modules/ibex/ibex.service';
import { EntityManager } from 'typeorm';
import { CreateAdminTransactionDto } from '../dtos/create-transaction.dto';
import { AdminTransactionType } from '../enums/adminTransactionType.enum';
import { AdminTransaction } from './create-transaction.interface';
import { LiquidyBuy } from './liquidity-buy';
import { LiquiditySell } from './liquidity-sell';
import { OsmoCredit } from './osmo-credit';
import { OsmoDebit } from './osmo-debit';

export class AdminTransactionFactory {
    static getTransactionType(
        createAdminTransactionDto: CreateAdminTransactionDto,
        entityManager: EntityManager,
        ibexService: IbexService,
    ): AdminTransaction {
        switch (createAdminTransactionDto.type) {
            case AdminTransactionType.OSMO_DEBIT:
                return new OsmoDebit(entityManager, createAdminTransactionDto, ibexService);
            case AdminTransactionType.OSMO_CREDIT:
                return new OsmoCredit(entityManager, createAdminTransactionDto, ibexService);
            case AdminTransactionType.LIQUIDITY_SELL:
                return new LiquiditySell(entityManager, createAdminTransactionDto);
            case AdminTransactionType.LIQUIDITY_BUY:
                return new LiquidyBuy(entityManager, createAdminTransactionDto);
            default:
                throw new Error('');
        }
    }
}
