import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Status } from 'src/common/enums/status.enum';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { TransactionSubtype } from 'src/common/enums/transactionSubtype.enum';
import { Transaction } from 'src/entities/transaction.entity';
import { In, Repository } from 'typeorm';
import { AuthUser } from '../auth/payloads/auth.payload';
import { GetAnalyticsDto } from './dtos/analytics.dto';

@Injectable()
export class AnalyticsService {
    constructor(@InjectRepository(Transaction) private transactionRepository: Repository<Transaction>) {}

    async getBtcBalanceHistory(authUser: AuthUser) {
        const btcBalanceHistory = await this.transactionRepository.find({
            select: {
                balance: true,
                createdAt: true,
            },
            where: {
                transactionGroup: {
                    fromUser: { id: authUser.sub },
                },
                subtype: In([
                    TransactionSubtype.DEBIT_BTC_SELL,
                    TransactionSubtype.CREDIT_BTC_BUY,
                    TransactionSubtype.DEBIT_BTC_TRANSFER_LN,
                    TransactionSubtype.DEBIT_BTC_TRANSFER_ONCHAIN,
                    TransactionSubtype.CREDIT_BTC_TRANSFER_LN,
                    TransactionSubtype.CREDIT_BTC_TRANSFER_ONCHAIN,
                ]),
            },
        });
        return btcBalanceHistory;
    }

    async getAnalitycsByCoin(authUser: AuthUser, query: GetAnalyticsDto) {
        try {
            const data = await Promise.all([
                this.getBTCAverage(authUser, query),
                this.getBtcBought(authUser, query),
                this.getBtcSold(authUser, query),
            ]);
            return {
                btcAverage: data[0],
                totalBtcBoughtInFiat: data[1],
                totalBtcSoldInFiat: data[2],
            };
        } catch (error) {
            throw new BadRequestException('Error getting analytics');
        }
    }

    private async getBtcSold(authUser: AuthUser, query: GetAnalyticsDto) {
        const fiatSoldTransactions = await this.transactionRepository.find({
            where: {
                transactionGroup: {
                    fromUser: { id: authUser.sub },
                    status: Status.COMPLETED,
                    transactionCoin: { id: query.coinId },
                },
                subtype: In([TransactionSubtype.CREDIT_FIAT_SELL]),
            },
        });
        let totalFiatSold = 0;

        fiatSoldTransactions.forEach((transaction) => {
            totalFiatSold += transaction.amount;
        });

        return totalFiatSold;
    }

    private async getBtcBought(authUser: AuthUser, query: GetAnalyticsDto) {
        const fiatBoughtTransactions = await this.transactionRepository.find({
            where: {
                transactionGroup: {
                    fromUser: { id: authUser.sub },
                    status: Status.COMPLETED,
                    transactionCoin: { id: query.coinId },
                },
                subtype: In([TransactionSubtype.DEBIT_FIAT_BUY]),
            },
        });
        let totalFiatBought = 0;

        fiatBoughtTransactions.forEach((transaction) => {
            totalFiatBought += transaction.amount;
        });

        return totalFiatBought;
    }

    private async getBTCAverage(authUser: AuthUser, query: GetAnalyticsDto) {
        try {
            const buyTransactions = await this.transactionRepository.find({
                where: {
                    transactionGroup: {
                        fromUser: { id: authUser.sub },
                        status: Status.COMPLETED,
                        type: In([TransactionType.SWAP, TransactionType.RECURRENT_BUY]),
                        transactionCoin: { id: query.coinId },
                    },
                    subtype: In([TransactionSubtype.DEBIT_BTC_SELL, TransactionSubtype.CREDIT_BTC_BUY]),
                },
                relations: ['transactionGroup'],
            });

            if (buyTransactions.length == 0) return 0;

            let numerator = 0;
            let denominator = 0;

            buyTransactions.forEach((transaction) => {
                numerator += transaction.amount * transaction.transactionGroup.btcPrice;
                denominator += transaction.amount;
            });

            const averagePrice = numerator / denominator;
            return Number(averagePrice.toFixed(2));
        } catch (error) {
            throw new BadRequestException('Error getting analytics');
        }
    }
}
