import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Decimal from 'decimal.js';
import { Response } from 'express';
import { typeSubtypes } from 'src/common/constants/constants';
import { Partner } from 'src/common/enums/partner.enum';
import { Status } from 'src/common/enums/status.enum';
import { TransactionMethodEnum } from 'src/common/enums/transactionMethod.enum';
import { TransactionSubtype } from 'src/common/enums/transactionSubtype.enum';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { CsvHelper } from 'src/common/helpers/csv.helper';
import { getDateRange } from 'src/common/utils/date-range.util';
import { RateType, getStableRate } from 'src/common/utils/stable-rate.util';
import { Coin } from 'src/entities/coin.entity';
import { Setting } from 'src/entities/setting.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { User } from 'src/entities/user.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { WalletHistory } from 'src/entities/walletHistory.entity';
import { IbexService } from 'src/modules/ibex/ibex.service';
import { CoinEnum } from 'src/modules/me/enums/coin.enum';
import { ReferralService } from 'src/modules/referral/referral.service';
import { SendGridService } from 'src/modules/send-grid/send-grid.service';
import { FundingApprovedTemplate } from 'src/modules/send-grid/templates/funding/fundingApproved.template';
import { FundingRejectedTemplate } from 'src/modules/send-grid/templates/funding/fundingRejected.template';
import { WithdrawalRejectedTemplate } from 'src/modules/send-grid/templates/withdrawal/rejectedWithdrawal.template';
import { WithdrawalApprovedTemplate } from 'src/modules/send-grid/templates/withdrawal/withdrawalApproved.template';
import { GetTransactionsDto } from 'src/modules/transactions/dtos/getTransaction.dto';
import { Between, Brackets, Equal, FindOptionsWhere, In, LessThanOrEqual, Like, MoreThanOrEqual, Repository } from 'typeorm';
import { AdminTransactionFactory } from './create-transactions/admin-transaction.factory';
import { ApproveTransactionDto } from './dtos/approveFunding.dto';
import { CreateAdminTransactionDto } from './dtos/create-transaction.dto';
import { GetTransactionsMetricsDto } from './dtos/getTotalTransactions.dto';
import { NetFlowMetricDto } from './dtos/net-flow-metric.dto';
import { RejectTransactionDto } from './dtos/rejectTransaction.dto';
import { Month } from './enums/months.enum';
import { MyLogger } from 'src/common/loggers/mylogger.logger';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { formatDateToSpanish } from 'src/common/utils/date-formatter.util';
import { findAndLockWallet } from 'src/common/utils/find-and-lock-wallet';
import { MainWalletsAccount } from 'src/common/enums/main-wallets.enum';
import { PartnersService } from 'src/modules/partners/partners.service';
import { PartnerStatus } from 'src/modules/partners/enums/partnerEvent.enum';

@Injectable()
export class AdminTransactionsService {
    private logger = new MyLogger(AdminTransactionsService.name);
    private queue = `AUTOFUNDING-${process.env.ENV}`;
    private QUEUE_URL = `https://ms-osmowallet-autofunding-dev-uq7lmpwdja-uc.a.run.app/transactions`;

    constructor(
        @InjectRepository(TransactionGroup)
        private transactionGroupRepository: Repository<TransactionGroup>,
        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Coin) private coinRepository: Repository<Coin>,
        @InjectRepository(Setting) private settingRepository: Repository<Setting>,
        @InjectRepository(WalletHistory)
        private walletHistoryRepository: Repository<WalletHistory>,
        private ibexService: IbexService,
        private sendGridService: SendGridService,
        private referralService: ReferralService,
        private googleCloudTasksService: GoogleCloudTasksService,
        private partnerService: PartnersService,
    ) {}

    private async fetchAndValidateCoin(coinId: string) {
        const coin = await this.coinRepository.findOneBy({ id: coinId });
        if (!coin) throw new BadRequestException('Invalid coin');
        if (coin.acronym == CoinEnum.SATS) throw new BadRequestException();
        return coin;
    }

    async getNetFlowMetrics(query: NetFlowMetricDto) {
        const currentYear = new Date().getFullYear();
        const startDate = new Date(`${currentYear}-${Month[query.fromMonth]}-01`);
        const endDate = new Date(`${currentYear}-${Month[query.toMonth]}-01`);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(endDate.getDate() - 1);
        const month1 = await this.walletHistoryRepository
            .createQueryBuilder('walletHistory')
            .innerJoin('walletHistory.wallet', 'wallet')
            .innerJoin('wallet.coin', 'coin')
            .select('SUM(walletHistory.availableBalance)', 'total')
            .where('walletHistory.createdAt BETWEEN :start AND :end', {
                start: startDate,
                end: new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0),
            })
            .andWhere('coin.id = :coinId', { coinId: query.coinId })
            .getRawOne();

        const month2 = await this.walletHistoryRepository
            .createQueryBuilder('walletHistory')
            .innerJoin('walletHistory.wallet', 'wallet')
            .innerJoin('wallet.coin', 'coin')
            .select('SUM(walletHistory.availableBalance)', 'total')
            .where('walletHistory.createdAt BETWEEN :start AND :end', {
                start: new Date(endDate.getFullYear(), endDate.getMonth(), 1),
                end: endDate,
            })
            .andWhere('coin.id = :coinId', { coinId: query.coinId })
            .getRawOne();
        const totalMonth1 = month1.total ?? 0;
        const totalMonth2 = month2.total ?? 0;

        const amount = new Decimal(totalMonth2).minus(new Decimal(totalMonth1)).toNumber();
        return {
            amount,
        };
    }

    async getAverageTransactionMetrics(query: GetTransactionsMetricsDto) {
        await this.fetchAndValidateCoin(query.coinId);
        const { startDate, endDate } = getDateRange(query);
        const transactionTypes = [TransactionType.FUNDING, TransactionType.WITHDRAW, TransactionType.SWAP];
        const averageTransactionMetricsPromises = transactionTypes.map(async (transactionType) => {
            const subtypeNames = typeSubtypes[transactionType];
            const result = await this.transactionRepository
                .createQueryBuilder('transaction')
                .select(['AVG(transaction.amount) as average', 'transaction.subtype'])
                .innerJoin('transaction.transactionGroup', 'transactionGroup')
                .andWhere('transactionGroup.transactionCoin = :coin', {
                    coin: query.coinId,
                })
                .andWhere('transaction.subtype IN (:...subtypeNames)', {
                    subtypeNames,
                })
                .andWhere('transactionGroup.createdAt BETWEEN :start AND :end', {
                    start: startDate,
                    end: endDate,
                })
                .andWhere('transactionGroup.type = :type', { type: transactionType })
                .andWhere('transactionGroup.status = :status', {
                    status: Status.COMPLETED,
                })
                .groupBy('transaction.subtype')
                .getRawMany();
            return result.map((item) => {
                let transactionType;
                switch (item['transaction_subtype']) {
                    case TransactionSubtype.DEBIT_FIAT_WITHDRAW:
                        transactionType = TransactionType.WITHDRAW;
                        break;
                    case TransactionSubtype.CREDIT_FIAT_FUNDING:
                        transactionType = TransactionType.FUNDING;
                        break;
                    case TransactionSubtype.CREDIT_FIAT_SELL:
                        transactionType = 'SELL';
                        break;
                    case TransactionSubtype.DEBIT_FIAT_BUY:
                        transactionType = 'BUY';
                        break;
                }
                return {
                    amount: parseFloat(item['average']) || 0,
                    type: transactionType,
                };
            });
        });
        const results = await Promise.all(averageTransactionMetricsPromises);
        return results.flat();
    }

    async getTotalTransactionsMetrics(query: GetTransactionsMetricsDto) {
        const coin = await this.fetchAndValidateCoin(query.coinId);
        const { startDate, endDate } = getDateRange(query);
        const transactionTypes = [
            TransactionType.SEND,
            TransactionType.AUTOCONVERT,
            TransactionType.SWAP,
            TransactionType.WITHDRAW,
            TransactionType.FUNDING,
            TransactionType.RECURRENT_BUY,
        ];
        const transactionMetricsPromises = transactionTypes.map(async (transactionType) => {
            const subtypeNames = typeSubtypes[transactionType];
            const result = await this.transactionGroupRepository
                .createQueryBuilder('transactionGroup')
                .select('SUM(transaction.amount)', 'total')
                .innerJoin('transactionGroup.transactions', 'transaction')
                .andWhere('transactionGroup.transactionCoin = :coin', {
                    coin: query.coinId,
                })
                .andWhere('transaction.subtype IN (:...subtypeNames)', {
                    subtypeNames,
                })
                .andWhere('transactionGroup.createdAt BETWEEN :start AND :end', {
                    start: startDate,
                    end: endDate,
                })
                .andWhere('transactionGroup.type = :type', { type: transactionType })
                .andWhere('transactionGroup.status = :status', {
                    status: Status.COMPLETED,
                })
                .groupBy('transactionGroup.type')
                .getRawMany();
            return {
                total: result.length > 0 ? parseFloat(result[0]['total']) : 0,
                type: transactionType,
            };
        });
        const results = await Promise.all(transactionMetricsPromises);
        const consolidatedUsdAmount = results
            ? results.reduce(
                  (sum, result) =>
                      new Decimal(new Decimal(sum).plus(new Decimal(result.total).div(coin.exchangeRate)).toFixed(2)).toNumber(),
                  0,
              )
            : 0;
        return {
            results,
            consolidatedUsdAmount,
        };
    }

    async createTransaction(data: CreateAdminTransactionDto) {
        const adminTransaction = AdminTransactionFactory.getTransactionType(data, this.userRepository.manager, this.ibexService);
        await adminTransaction.create();
    }

    async getCSVTransactions(data: GetTransactionsDto, res: Response) {
        const transactions = [];
        const take = 1000;
        let skip = 0;
        let result = [];
        do {
            const query = this.getCSVQuery(data);
            result = await query.skip(skip).take(take).getRawMany();
            result.forEach((transaction) => {
                transaction.userEmail = transaction.fromUser_email || transaction.toUser_email;
                transaction.userName = transaction.fromUser_first_name || transaction.toUser_first_name;
                transaction.userPhone = transaction.fromUser_mobile || transaction.toUser_mobile;
                delete transaction.fromUser_email;
                delete transaction.fromUser_first_name;
                delete transaction.fromUser_mobile;
                delete transaction.toUser_email;
                delete transaction.toUser_first_name;
                delete transaction.toUser_mobile;
            });
            transactions.push(...result);
            skip += take;
        } while (result.length === take);
        transactions.forEach((transaction) => {
            transaction.createdAt = new Date(transaction.transaction_created_at).toISOString().split('T')[0];
        });
        try {
            await CsvHelper.createCsv(result, CsvHelper.TRANSACTIONS_FILENAME);
            res.download(CsvHelper.TRANSACTIONS_FILENAME);
        } catch (error) {
            this.logger.log('Error gettings transactions to donwload as csv: ' + error);
            throw new BadRequestException('Not available transactions for your query');
        }
    }

    private getCSVQuery(queries: GetTransactionsDto) {
        let queryBuilder = this.transactionRepository
            .createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.transactionGroup', 'transactionGroup')
            .leftJoinAndSelect('transactionGroup.fromUser', 'fromUser')
            .leftJoinAndSelect('transactionGroup.toUser', 'toUser')
            .innerJoinAndSelect('transaction.wallet', 'wallet')
            .innerJoinAndSelect('wallet.coin', 'coin')
            .select([
                'transaction.id',
                'transactionGroup.type',
                'transactionGroup.id as father_id',
                'transaction.amount',
                'transaction.createdAt',
                'fromUser.email',
                'fromUser.firstName',
                'fromUser.mobile',
                'toUser.email',
                'toUser.firstName',
                'toUser.mobile',
                'transaction.subtype',
                'coin.acronym',
                'transactionGroup.method',
                'transactionGroup.status',
            ])
            .orderBy('transaction.createdAt', 'DESC');

        if (queries.query) {
            const likeQuery = `%${queries.query}%`;
            queryBuilder.andWhere(
                new Brackets((qb) => {
                    qb.orWhere('fromUser.email LIKE :query', { query: likeQuery })
                        .orWhere('fromUser.firstName LIKE :query', { query: likeQuery })
                        .orWhere('fromUser.lastName LIKE :query', { query: likeQuery })
                        .orWhere('fromUser.username LIKE :query', { query: likeQuery })
                        .orWhere('fromUser.mobile LIKE :query', { query: likeQuery })
                        .orWhere('toUser.email LIKE :query', { query: likeQuery })
                        .orWhere('toUser.firstName LIKE :query', { query: likeQuery })
                        .orWhere('toUser.lastName LIKE :query', { query: likeQuery })
                        .orWhere('toUser.username LIKE :query', { query: likeQuery })
                        .orWhere('toUser.mobile LIKE :query', { query: likeQuery });
                }),
            );
        }
        // Conditionally add where clause if data.userId is not null
        if (queries.userId) {
            queryBuilder = queryBuilder.where('transactionGroup.fromUser.id = :userId OR transactionGroup.toUser.id = :userId', {
                userId: queries.userId,
            });
        }
        if (queries.partner != null) {
            queryBuilder = queryBuilder.where('transactionGroup.partner = :partner', {
                partner: queries.partner,
            });
        }

        if (queries.fromDate != null && queries.toDate != null) {
            queryBuilder = queryBuilder.where(`transaction.createdAt BETWEEN :fromDate AND :toDate`, {
                fromDate: queries.fromDate,
                toDate: queries.toDate,
            });
        }
        if (queries.fromDate != null && queries.toDate == null) {
            queryBuilder = queryBuilder.where(`transaction.createdAt >= :fromDate`, {
                fromDate: queries.fromDate,
            });
        }
        if (queries.fromDate == null && queries.toDate != null) {
            queryBuilder = queryBuilder.where(`transaction.createdAt <= :toDate`, {
                toDate: queries.toDate,
            });
        }

        if (queries.coinId != null) {
            queryBuilder = queryBuilder.andWhere(`wallet.coin.id = :coinId`, {
                coinId: queries.coinId,
            });
        }

        if (queries.method != null) {
            queryBuilder = queryBuilder.andWhere(`transactionGroup.method = :method`, {
                method: queries.method,
            });
        }

        if (queries.partner != null) {
            queryBuilder = queryBuilder.andWhere(`transactionGroup.partner = :partner`, {
                partner: queries.partner,
            });
        }
        if (queries.status != null) {
            queryBuilder = queryBuilder.andWhere(`transactionGroup.status = :status`, {
                status: queries.status,
            });
        }

        if (queries.fromAmount != null && queries.toAmount != null) {
            queryBuilder = queryBuilder.andWhere(`transaction.amount BETWEEN :fromAmount AND :toAmount`, {
                fromAmount: queries.fromAmount,
                toAmount: queries.toAmount,
            });
        }
        if (queries.fromAmount != null && queries.toAmount == null) {
            queryBuilder = queryBuilder.andWhere(`transaction.amount >= :fromAmount`, {
                fromAmount: queries.fromAmount,
            });
        }
        if (queries.fromAmount == null && queries.toAmount != null) {
            queryBuilder = queryBuilder.andWhere(`transaction.amount <= :toAmount`, {
                toAmount: queries.toAmount,
            });
        }

        if (queries.types != null && queries.types.length > 0) {
            queryBuilder = queryBuilder.andWhere('transactionGroup.type IN (:...types)', {
                types: queries.types,
            });
        }
        return queryBuilder;
    }

    async getTransactions(queries: GetTransactionsDto) {
        const constantQueries = this.encapsulateQueries(queries);
        const searchQuery = [
            { firstName: Like(`%${queries.query}%`) },
            { lastName: Like(`%${queries.query}%`) },
            { username: Like(`%${queries.query}%`) },
            { email: Like(`%${queries.query}%`) },
            { mobile: Like(`%${queries.query}%`) },
        ];
        const pageSize = 15;
        const currentPage = queries.page || 1;
        const offset = (currentPage - 1) * pageSize;
        const userQuery = queries.query ? searchQuery : queries.userId ? { id: 'ada177d7-e10d-40c4-9976-bbd42ce08c2d' } : [];
        const noteQuery: FindOptionsWhere<TransactionGroup> = {
            ...constantQueries,
            note: queries.query ? Like(`%${queries.query}%`) : null,
        };
        let options: FindOptionsWhere<TransactionGroup>[] = [
            {
                ...constantQueries,
                fromUser: userQuery,
            },

            {
                toUser: userQuery,
                ...constantQueries,
            },
        ];
        if (queries.query) options.push(noteQuery);
        console.log(noteQuery);
        const transactions = await this.transactionGroupRepository.findAndCount({
            where: options,
            skip: offset,
            take: pageSize,
            order: { createdAt: 'desc' },
            relations: {
                fromUser: { addresses: true },
                toUser: { addresses: true },
                transactionCoin: true,
                historicRate: {
                    historicCoinRate: {
                        coin: true,
                    },
                },
                transactions: {
                    transactionDetail: true,
                    wallet: { coin: true },
                },
                osmoBusiness: true,
                fees: {
                    coin: true,
                },
                referral: true,
            },
        });
        const totalTransactionGroups = Math.ceil(transactions[1] / pageSize);

        return {
            data: transactions[0],
            currentPage: currentPage,
            totalPages: totalTransactionGroups,
        };
    }

    encapsulateQueries(queries: GetTransactionsDto) {
        let dateQuery = null;
        let coinQuery = null;
        let methodQuery = null;
        let statusQuery = null;
        let amountQuery = null;
        let partnerQuery = null;
        if (queries.fromDate != null && queries.toDate != null) {
            dateQuery = Between(queries.fromDate, queries.toDate);
        }
        if (queries.fromDate != null && queries.toDate == null) {
            dateQuery = MoreThanOrEqual(queries.fromDate);
        }
        if (queries.fromDate == null && queries.toDate != null) {
            dateQuery = LessThanOrEqual(queries.toDate);
        }

        if (queries.coinId != null) {
            coinQuery = Equal(queries.coinId);
        }

        if (queries.method != null) {
            methodQuery = Equal(queries.method);
        }

        if (queries.partner != null) {
            partnerQuery = Equal(queries.partner);
        }

        if (queries.status != null) {
            statusQuery = Equal(queries.status);
        }

        if (queries.fromAmount != null && queries.toAmount != null) {
            amountQuery = Between(queries.fromAmount, queries.toAmount);
        }
        if (queries.fromAmount != null && queries.toAmount == null) {
            amountQuery = MoreThanOrEqual(queries.fromAmount);
        }
        if (queries.fromAmount == null && queries.toAmount != null) {
            amountQuery = LessThanOrEqual(queries.toAmount);
        }

        return {
            createdAt: dateQuery,
            transactionCoin: { id: coinQuery },
            method: methodQuery,
            status: statusQuery,
            transactions: {
                amount: amountQuery,
            },
            type: In(queries.types),
            partner: partnerQuery,
        };
    }
    async rejectTransaction(id: string, body: RejectTransactionDto) {
        try {
            const transactionGroup = await this.transactionGroupRepository.findOne({
                relations: {
                    fromUser: true,
                    transactionCoin: true,
                    transactions: true,
                },
                where: {
                    id: id,
                },
            });
            if (!transactionGroup) throw new BadRequestException('Invalid transaction Id');
            if (transactionGroup.status == Status.COMPLETED) throw new BadRequestException('The Transaction has been completed already');
            if (transactionGroup.status == Status.REJECTED) throw new BadRequestException('The Transaction has ben rejected already');
            const isStable = transactionGroup.method == TransactionMethodEnum.STABLE_COIN;

            if (transactionGroup.type == TransactionType.FUNDING) {
                if (isStable) {
                    return await this.rejectStableFunding(transactionGroup, body);
                }
                await this.rejectFunding(transactionGroup, body);
            } else {
                if (transactionGroup.type == TransactionType.WITHDRAW) {
                    if (isStable) {
                        await this.rejectStableWithdraw(transactionGroup, body);
                    } else {
                        await this.rejectWithdraw(transactionGroup, body);
                    }
                }
            }
        } catch (error) {
            throw new BadRequestException('Transaction can not be rejected');
        }
    }

    private async rejectWithdraw(transactionGroup: TransactionGroup, data: RejectTransactionDto) {
        const debitUserAmount = transactionGroup.transactions.find((t) => t.subtype == TransactionSubtype.DEBIT_FIAT_WITHDRAW).amount;
        const rejectedStatus = Status.REJECTED;

        await this.transactionGroupRepository.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const userWallet = await findAndLockWallet({
                entityManager: entityManager,
                coinId: transactionGroup.transactionCoin.id,
                userId: transactionGroup.fromUser.id,
            });

            const updatedAvailableBalance = new Decimal(userWallet.availableBalance).plus(debitUserAmount).toNumber();
            await Promise.all([
                entityManager.update(Wallet, userWallet.id, { availableBalance: updatedAvailableBalance }),
                entityManager.update(TransactionGroup, transactionGroup.id, {
                    status: rejectedStatus,
                    note: data.note,
                }),
            ]);

            const template = new WithdrawalRejectedTemplate(
                [
                    {
                        email: transactionGroup.fromUser.email,
                        name: transactionGroup.fromUser.firstName,
                    },
                ],
                {
                    amount: debitUserAmount,
                    status: rejectedStatus,
                    transactionId: transactionGroup.id,
                    currency: transactionGroup.transactionCoin.acronym,
                    date: new Date().toISOString(),
                    note: data.note,
                },
            );
            this.sendGridService.sendMail(template);
        });
        if (transactionGroup.partner) {
            this.partnerService.notifyBankTransaction(transactionGroup.id, PartnerStatus.FAILED);
        }
    }

    private async rejectFunding(transactionGroup: TransactionGroup, data: RejectTransactionDto) {
        const creditAmount = transactionGroup.transactions[0].amount;
        const rejectedStatus = Status.REJECTED;
        await this.transactionGroupRepository.manager.transaction(async (entityManager) => {
            await entityManager.update(TransactionGroup, transactionGroup.id, {
                status: rejectedStatus,
                note: data.note,
            });
            const template = new FundingRejectedTemplate(
                [
                    {
                        email: transactionGroup.fromUser.email,
                        name: transactionGroup.fromUser.firstName,
                    },
                ],
                {
                    amount: creditAmount,
                    status: rejectedStatus,
                    transactionId: transactionGroup.id,
                    currency: transactionGroup.transactionCoin.acronym,
                    date: new Date().toISOString(),
                    note: data.note,
                },
            );
            this.sendGridService.sendMail(template);
        });
    }

    async approveTransaction(id: string, body: ApproveTransactionDto) {
        try {
            const transactionGroup = await this.transactionGroupRepository.findOne({
                relations: {
                    transactionCoin: true,
                    transactions: true,
                    fromUser: true,
                },
                where: {
                    id: id,
                },
            });
            if (!transactionGroup) throw new BadRequestException('Invalid transaction Id');
            if (transactionGroup.status == Status.COMPLETED) throw new BadRequestException('The Transaction has been completed already');
            if (transactionGroup.status == Status.REJECTED) throw new BadRequestException('The Transaction has ben rejected already');
            const isStable = transactionGroup.method == TransactionMethodEnum.STABLE_COIN;
            if (transactionGroup.type == TransactionType.FUNDING) {
                if (isStable) {
                    return await this.approveStableFunding(transactionGroup, body);
                } else {
                    return await this.approveBankFunding(transactionGroup);
                }
            } else {
                if (transactionGroup.type == TransactionType.WITHDRAW) {
                    if (isStable) {
                        return await this.approveStableWithdraw(transactionGroup, body);
                    } else {
                        return await this.approveWithdraw(transactionGroup);
                    }
                }
            }
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            throw new BadRequestException('Transaction could not be approved');
        }
    }

    private async approveBankFunding(transactionGroup: TransactionGroup) {
        const creditAmount = transactionGroup.transactions[0].amount;
        const completeStatus = Status.COMPLETED;
        await this.transactionGroupRepository.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const [userWallet, osmoWallet] = await Promise.all([
                findAndLockWallet({
                    entityManager: entityManager,
                    coinId: transactionGroup.transactionCoin.id,
                    userId: transactionGroup.fromUser.id,
                }),
                findAndLockWallet({
                    entityManager: entityManager,
                    coinId: transactionGroup.transactionCoin.id,
                    alias: MainWalletsAccount.MAIN,
                }),
            ]);
            await Promise.all([
                entityManager.update(Wallet, userWallet.id, {
                    availableBalance: new Decimal(userWallet.availableBalance).plus(creditAmount).toNumber(),
                    balance: new Decimal(userWallet.balance).plus(creditAmount).toNumber(),
                }),
                entityManager.update(Wallet, osmoWallet.id, {
                    balance: new Decimal(osmoWallet.balance).plus(creditAmount).toNumber(),
                    availableBalance: new Decimal(osmoWallet.availableBalance).plus(creditAmount).toNumber(),
                }),
                entityManager.update(TransactionGroup, transactionGroup.id, {
                    status: completeStatus,
                }),
            ]);
            const template = new FundingApprovedTemplate(
                [
                    {
                        email: transactionGroup.fromUser.email,
                        name: transactionGroup.fromUser.firstName,
                    },
                ],
                {
                    amount: creditAmount,
                    status: completeStatus,
                    transactionId: transactionGroup.id,
                    currency: transactionGroup.transactionCoin.acronym,
                    date: new Date().toISOString(),
                },
            );
            this.sendGridService.sendMail(template);
        });
    }

    private async approveWithdraw(transactionGroup: TransactionGroup) {
        const debitUserAmount = transactionGroup.transactions.find((t) => t.subtype == TransactionSubtype.DEBIT_FIAT_WITHDRAW).amount;
        const debitOsmoAmount = transactionGroup.transactions.find((t) => t.subtype == TransactionSubtype.DEBIT_FIAT_WITHDRAW_OSMO).amount;
        const feeOsmoAmount = transactionGroup.transactions.find((t) => t.subtype == TransactionSubtype.FEE_WITHDRAW).amount;
        const completeStatus = Status.COMPLETED;
        await this.transactionGroupRepository.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const [userWallet, osmoWallet, osmoWalletFee] = await Promise.all([
                findAndLockWallet({
                    entityManager: entityManager,
                    coinId: transactionGroup.transactionCoin.id,
                    userId: transactionGroup.fromUser.id,
                }),
                findAndLockWallet({
                    entityManager: entityManager,
                    coinId: transactionGroup.transactionCoin.id,
                    alias: MainWalletsAccount.MAIN,
                }),
                findAndLockWallet({
                    entityManager: entityManager,
                    coinId: transactionGroup.transactionCoin.id,
                    alias: MainWalletsAccount.FEES,
                }),
            ]);

            let fee = feeOsmoAmount;
            if (transactionGroup.partner == Partner.STRIKE) {
                fee = 0;
            }
            const updatedUserWalletBalance = new Decimal(userWallet.balance).minus(debitUserAmount).toNumber();
            const updatedOsmoWalletAvailableBalance = new Decimal(osmoWallet.availableBalance).minus(debitUserAmount).toNumber();
            const updatedOsmoWalletBalance = new Decimal(osmoWallet.balance).minus(debitOsmoAmount).toNumber();
            const updatedOsmoWalletFeeBalance = new Decimal(osmoWalletFee.balance).plus(fee).toNumber(); // Should be 0 if comes from strike
            const updatedOsmoWalletFeeAvailableBalance = new Decimal(osmoWalletFee.availableBalance).plus(fee).toNumber();

            await Promise.all([
                entityManager.update(Wallet, userWallet.id, { balance: updatedUserWalletBalance }),
                entityManager.update(Wallet, osmoWallet.id, { availableBalance: updatedOsmoWalletAvailableBalance, balance: updatedOsmoWalletBalance }),
                entityManager.update(Wallet, osmoWalletFee.id, { balance: updatedOsmoWalletFeeBalance, availableBalance: updatedOsmoWalletFeeAvailableBalance }),
                entityManager.update(TransactionGroup, transactionGroup.id, { status: completeStatus }),
            ]);
            const template = new WithdrawalApprovedTemplate(
                [
                    {
                        email: transactionGroup.fromUser.email,
                        name: transactionGroup.fromUser.firstName,
                    },
                ],
                {
                    amount: debitUserAmount,
                    status: completeStatus,
                    transactionId: transactionGroup.id,
                    currency: transactionGroup.transactionCoin.acronym,
                    date: new Date().toISOString(),
                },
            );
            this.sendGridService.sendMail(template);
        });
        if (transactionGroup.partner) {
            this.partnerService.notifyBankTransaction(transactionGroup.id, PartnerStatus.SUCCESS);
        }
    }

    private async approveStableFunding(transactionGroup: TransactionGroup, body: ApproveTransactionDto) {
        const completeStatus = Status.COMPLETED;
        const settings = await this.settingRepository.find();
        const stableCoin = await this.coinRepository.findOneBy({ acronym: 'USDT' });
        const usdLowerRate = getStableRate(settings, RateType.LOWER, CoinEnum.USD);
        const fiatLowerRate = getStableRate(settings, RateType.LOWER, transactionGroup.transactionCoin.acronym);
        const lowerRate = transactionGroup.transactionCoin.acronym == CoinEnum.USD ? usdLowerRate : fiatLowerRate;
        const upperRate = transactionGroup.transactionCoin.acronym == CoinEnum.USD ? new Decimal(1) : fiatLowerRate.dividedBy(usdLowerRate);
        const upperRateFixed = new Decimal(upperRate);

        const upperAmount = new Decimal(body.amount).times(upperRateFixed);
        const lowerAmount = new Decimal(body.amount).times(lowerRate).toFixed(2);

        const fee = new Decimal(upperAmount).minus(lowerAmount).toFixed(2);

        console.log('upperRate:', upperRateFixed);
        console.log('lowerRate:', lowerRate);

        console.log('upperAmount:', upperAmount);
        console.log('lowerAmount:', lowerAmount);
        console.log('fee:', fee);
        const osmoTransaction = transactionGroup.transactions.find(
            (transaction) => transaction.subtype == TransactionSubtype.CREDIT_STABLE_OSMO,
        );
        const userTransaction = transactionGroup.transactions.find(
            (transaction) => transaction.subtype == TransactionSubtype.CREDIT_FIAT_FUNDING,
        );
        const feeTransaction = transactionGroup.transactions.find((transaction) => transaction.subtype == TransactionSubtype.FEE_FUNDING);

        await this.transactionGroupRepository.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const [userWallet, osmoWallet, osmoFeeWallet] = await Promise.all([
                findAndLockWallet({
                    entityManager: entityManager,
                    coinId: transactionGroup.transactionCoin.id,
                    userId: transactionGroup.fromUser.id,
                }),
                findAndLockWallet({ entityManager: entityManager, coinId: stableCoin.id, alias: MainWalletsAccount.MAIN }),
                findAndLockWallet({
                    entityManager: entityManager,
                    coinId: transactionGroup.transactionCoin.id,
                    alias: MainWalletsAccount.FEES,
                }),
            ]);
            const updatedUserWallet = {
                availableBalance: new Decimal(userWallet.availableBalance).plus(lowerAmount).toNumber(),
                balance: new Decimal(userWallet.balance).plus(lowerAmount).toNumber(),
            };

            const updatedOsmoWallet = {
                availableBalance: new Decimal(osmoWallet.availableBalance).plus(body.amount).toNumber(),
                balance: new Decimal(osmoWallet.balance).plus(body.amount).toNumber(),
            };

            const updatedOsmoFeeWallet = {
                availableBalance: new Decimal(osmoFeeWallet.availableBalance).plus(fee).toNumber(),
                balance: new Decimal(osmoFeeWallet.balance).plus(fee).toNumber(),
            };
            console.log(upperRate);
            console.log(lowerAmount);
            console.log(fee);
            await Promise.all([
                entityManager.update(Wallet, userWallet.id, updatedUserWallet),
                entityManager.update(Wallet, osmoWallet.id, updatedOsmoWallet),
                entityManager.update(Wallet, osmoFeeWallet.id, updatedOsmoFeeWallet),
                entityManager.update(TransactionGroup, transactionGroup.id, {
                    status: completeStatus,
                }),
                entityManager.update(Transaction, osmoTransaction.id, {
                    amount: body.amount,
                }),
                entityManager.update(Transaction, userTransaction.id, {
                    amount: parseFloat(lowerAmount),
                }),
                entityManager.update(Transaction, feeTransaction.id, {
                    amount: parseFloat(fee),
                }),
            ]);
            const template = new FundingApprovedTemplate(
                [
                    {
                        email: transactionGroup.fromUser.email,
                        name: transactionGroup.fromUser.firstName,
                    },
                ],
                {
                    amount: parseFloat(lowerAmount),
                    status: completeStatus,
                    transactionId: transactionGroup.id,
                    currency: transactionGroup.transactionCoin.acronym,
                    date: new Date().toISOString(),
                },
            );
            this.sendGridService.sendMail(template);
        });
    }

    private async rejectStableFunding(transactionGroup: TransactionGroup, body: RejectTransactionDto) {
        const rejectedStatus = Status.REJECTED;
        await this.transactionGroupRepository.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const userTransaction = transactionGroup.transactions.find(
                (transaction) => transaction.subtype == TransactionSubtype.CREDIT_FIAT_FUNDING,
            );
            await Promise.all([
                entityManager.update(TransactionGroup, transactionGroup.id, {
                    status: rejectedStatus,
                    note: body.note,
                }),
            ]);
            const template = new FundingRejectedTemplate(
                [
                    {
                        email: transactionGroup.fromUser.email,
                        name: transactionGroup.fromUser.firstName,
                    },
                ],
                {
                    amount: userTransaction.amount,
                    status: rejectedStatus,
                    transactionId: transactionGroup.id,
                    currency: transactionGroup.transactionCoin.acronym,
                    date: formatDateToSpanish(new Date()),
                },
            );
            this.sendGridService.sendMail(template);
        });
    }

    private async approveStableWithdraw(transactionGroup: TransactionGroup, body: ApproveTransactionDto) {
        const userTransaction = transactionGroup.transactions.find((t) => t.subtype == TransactionSubtype.DEBIT_FIAT_WITHDRAW);
        const osmoTransaction = transactionGroup.transactions.find((t) => t.subtype == TransactionSubtype.DEBIT_STABLE_OSMO);
        const feeOsmoTransaction = transactionGroup.transactions.find((t) => t.subtype == TransactionSubtype.FEE_WITHDRAW);
        const debitUserAmount = userTransaction.amount;
        const debitOsmoAmount = osmoTransaction.amount;
        const feeOsmoAmount = feeOsmoTransaction.amount;
        const completeStatus = Status.COMPLETED;
        const usdtCoin = await this.coinRepository.findOneBy({ acronym: CoinEnum.USDT });
        await this.transactionGroupRepository.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const [userWallet, osmoWallet, osmoFeeWallet] = await Promise.all([
                findAndLockWallet({
                    entityManager: entityManager,
                    coinId: transactionGroup.transactionCoin.id,
                    userId: transactionGroup.fromUser.id,
                }),
                findAndLockWallet({ entityManager: entityManager, coinId: usdtCoin.id, alias: MainWalletsAccount.MAIN }),
                findAndLockWallet({
                    entityManager: entityManager,
                    coinId: transactionGroup.transactionCoin.id,
                    alias: MainWalletsAccount.FEES,
                }),
            ]);
            const updatedOsmoFeeWalletBalance = new Decimal(osmoFeeWallet.balance).plus(feeOsmoAmount).toNumber();
            const updatedUserWalletBalance = new Decimal(userWallet.balance).minus(debitUserAmount).toNumber();
            const updatedOsmoWalletAvailableBalance = new Decimal(osmoWallet.availableBalance).minus(debitOsmoAmount).toNumber();
            const updatedOsmoWalletBalance = new Decimal(osmoWallet.balance).minus(debitOsmoAmount).toNumber();

            await Promise.all([
                entityManager.update(Wallet, osmoFeeWallet.id, { balance: updatedOsmoFeeWalletBalance }),
                entityManager.update(Wallet, userWallet.id, { balance: updatedUserWalletBalance }),
                entityManager.update(Wallet, osmoWallet.id, { availableBalance: updatedOsmoWalletAvailableBalance, balance: updatedOsmoWalletBalance }),
                entityManager.update(TransactionGroup, transactionGroup.id, {
                    status: completeStatus,
                    metadata: {
                        linkExplorer: body.linkExplorer,
                    },
                }),
            ]);
            const template = new WithdrawalApprovedTemplate(
                [
                    {
                        email: transactionGroup.fromUser.email,
                        name: transactionGroup.fromUser.firstName,
                    },
                ],
                {
                    amount: userTransaction.amount,
                    status: completeStatus,
                    transactionId: transactionGroup.id,
                    currency: transactionGroup.transactionCoin.acronym,
                    date: formatDateToSpanish(new Date()),
                },
            );
            this.sendGridService.sendMail(template);
        });
    }

    private async rejectStableWithdraw(transactionGroup: TransactionGroup, data: RejectTransactionDto) {
        const rejectedStatus = Status.REJECTED;
        const userTransaction = transactionGroup.transactions.find((t) => t.subtype == TransactionSubtype.DEBIT_FIAT_WITHDRAW);
        await this.transactionGroupRepository.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const userWallet = await findAndLockWallet({
                entityManager: entityManager,
                coinId: transactionGroup.transactionCoin.id,
                userId: transactionGroup.fromUser.id,
            });

            const updatedAvailableBalance = new Decimal(userWallet.availableBalance).plus(userTransaction.amount).toNumber();
            await Promise.all([
                entityManager.update(Wallet, userWallet.id, { availableBalance: updatedAvailableBalance }),
                entityManager.update(TransactionGroup, transactionGroup.id, {
                    status: rejectedStatus,
                    note: data.note,
                }),
            ]);
            const template = new WithdrawalRejectedTemplate(
                [
                    {
                        email: transactionGroup.fromUser.email,
                        name: transactionGroup.fromUser.firstName,
                    },
                ],
                {
                    amount: userTransaction.amount,
                    status: rejectedStatus,
                    transactionId: transactionGroup.id,
                    currency: transactionGroup.transactionCoin.acronym,
                    date: formatDateToSpanish(new Date()),
                },
            );
            this.sendGridService.sendMail(template);
        });
    }

    async validateTransactions(file: number[], fromDate: Date, toDate: Date) {
        const { data: transactions } = await this.getTransactions({
            fromDate,
            toDate,
            types: [TransactionType.FUNDING],
            method: TransactionMethodEnum.TRANSFER,
            status: Status.PENDING,
        });

        this.logger.log('validate funding transaction task created');

        const buffer = Buffer.from(file);

        await this.googleCloudTasksService.createExternalTask({
            body: {
                transactions: transactions,
                file: buffer.toString('hex'),
            },
            headers: {
                authorization: process.env.GCLOUD_FUNCTIONS_API_KEY,
                'Content-Type': 'application/json',
            },
            queue: this.queue,
            url: this.QUEUE_URL,
        });

        return { message: 'Task scheduled' };
    }
}
