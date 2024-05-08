import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { Response } from 'express';
import { Model } from 'mongoose';
import { typeSubtypes } from 'src/common/constants/constants';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { CsvHelper } from 'src/common/helpers/csv.helper';
import { MyLogger } from 'src/common/loggers/mylogger.logger';
import { getDateRange } from 'src/common/utils/date-range.util';
import { BankAccount } from 'src/entities/bank.account.entity';
import { Coin } from 'src/entities/coin.entity';
import { KycVerification } from 'src/entities/kycVerification.entity';
import { Otp } from 'src/entities/otp.entity';
import { TransactionDetail } from 'src/entities/transaction.detail.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { User } from 'src/entities/user.entity';
import { UserTransactionLimit } from 'src/entities/userTransactionLimit.entity';
import { Verification } from 'src/entities/verification.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { AuthService } from 'src/modules/auth/auth.service';
import { FeaturesService } from 'src/modules/features/features.service';
import { KycService } from 'src/modules/kyc/kyc.service';
import { CoinEnum } from 'src/modules/me/enums/coin.enum';
import { GetTransactionsDto } from 'src/modules/transactions/dtos/getTransaction.dto';
import { UsersService } from 'src/modules/users/users.service';
import { UserCard } from 'src/schemas/userCard.schema';
import { AlgoliaService } from 'src/services/algolia/algolia.service';
import { OnvoService } from 'src/services/onvo/onvo.service';
import {
    Between,
    Brackets,
    Equal,
    In,
    LessThan,
    LessThanOrEqual,
    Like,
    MoreThan,
    MoreThanOrEqual,
    QueryFailedError,
    Repository,
} from 'typeorm';
import { GetUserCSVDTO, GetUsersDto } from './dtos/getUsers.dto';
import { TransactionMetricDto } from './dtos/transactionMetric.dto';
import { UpdateUsersDto } from './dtos/updateUser.dto';
import { MetaMapUser } from 'src/modules/kyc/interfaces/raw-kyc';

@Injectable()
export class AdminUsersService {
    private logger = new MyLogger(AdminUsersService.name);
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Verification) private verificationRepository: Repository<Verification>,
        @InjectRepository(KycVerification) private kycVerificationRepository: Repository<KycVerification>,
        @InjectRepository(Otp) private otpRepository: Repository<Otp>,
        @InjectRepository(TransactionDetail)
        private transactionDetailRepository: Repository<TransactionDetail>,
        @InjectRepository(TransactionGroup) private transactionGroupRepository: Repository<TransactionGroup>,
        @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
        @InjectRepository(Coin) private coinRepository: Repository<Coin>,
        @InjectRepository(BankAccount) private bankAccountRepository: Repository<BankAccount>,
        @InjectRepository(UserTransactionLimit)
        private userTransactionLimitRepository: Repository<UserTransactionLimit>,
        @InjectModel(UserCard.name) private userCardModel: Model<UserCard>,
        private featureService: FeaturesService,
        private kycService: KycService,
        private authService: AuthService,
        private algoliaService: AlgoliaService,
        private userService: UsersService,
        private onvoService: OnvoService,
    ) {}

    private getCSVQuery(query: GetUserCSVDTO) {
        let queryBuilder = this.userRepository
            .createQueryBuilder('user')
            .innerJoinAndSelect('user.verifications', 'verification')
            .select([
                'user.id',
                'user.firstName',
                'user.lastName',
                'user.isActive',
                'user.email',
                'user.mobile',
                'user.nationality',
                'user.residence',
                'user.createdAt',
                'user.updatedAt',
                'verification.mobile',
                'verification.kyc',
                'verification.email',
            ])
            .where(query.isActive ? 'user.isActive = :isActive' : '1=1', { isActive: query.isActive })
            .andWhere(query.residence ? 'user.residence = :residence' : '1=1', {
                residence: query.residence,
            })
            .andWhere(query.nationality ? 'user.nationality = :nationality' : '1=1', {
                nationality: query.nationality,
            })
            .andWhere(query.isEmailVerified ? 'verification.email = :isEmailVerified' : '1=1', {
                isEmailVerified: query.isEmailVerified,
            })
            .andWhere(query.isKycVerified ? 'verification.kyc = :isKycVerified' : '1=1', {
                isKycVerified: query.isKycVerified,
            })
            .andWhere(query.isPhoneVerified ? 'verification.mobile = :isMobileVerified' : '1=1', {
                isMobileVerified: query.isPhoneVerified,
            });

        if (query.fromDate != null && query.toDate != null) {
            queryBuilder = queryBuilder.andWhere(`user.createdAt BETWEEN :fromDate AND :toDate`, {
                fromDate: query.fromDate,
                toDate: query.toDate,
            });
        }
        if (query.fromDate != null && query.toDate == null) {
            queryBuilder = queryBuilder.andWhere(`user.createdAt >= :fromDate`, {
                fromDate: query.fromDate,
            });
        }
        if (query.fromDate == null && query.toDate != null) {
            queryBuilder = queryBuilder.andWhere(`user.createdAt <= :toDate`, {
                toDate: query.toDate,
            });
        }
        return queryBuilder;
    }

    async getUsersCSV(res: Response, query: GetUserCSVDTO) {
        const users = [];
        const take = 1000;
        let skip = 0;
        let result = [];
        do {
            const queryBuilder = this.getCSVQuery(query);
            result = await queryBuilder.skip(skip).take(take).getRawMany();
            users.push(...result);
            skip += take;
        } while (result.length === take);
        if (result.length == 0) {
            throw new BadRequestException('Not available users for your query');
        }
        try {
            await CsvHelper.createCsv(result, CsvHelper.USER_FILENAME);
            res.download(CsvHelper.USER_FILENAME);
        } catch (error) {
            this.logger.log('Error getting users to donwload as csv: ' + error);
            throw new BadRequestException('Not available users for your query');
        }
    }

    async getUserLimits(id: string) {
        const userLimits = await this.userTransactionLimitRepository.find({
            relations: {
                feature: true,
            },
            where: {
                user: { id: id },
            },
        });
        const tierFeatures = await Promise.all(
            userLimits.map((userLimit) => this.featureService.getTierFeature(userLimit.feature.id, { sub: id })),
        );
        return {
            userLimits,
            tierFeatures,
        };
    }

    async getBankAccountsByUser(id: string) {
        const bankAccounts = await this.bankAccountRepository.find({
            relations: {
                coin: true,
                bank: true,
            },
            where: {
                user: { id: id },
            },
        });
        return bankAccounts;
    }

    async getTransactionMetrics(query: TransactionMetricDto) {
        const coin = await this.coinRepository.findOneBy({ id: query.coinId });
        if (!coin) throw new BadRequestException('Invalid coin');

        const { startDate, endDate } = getDateRange(query);

        const transactionTypes = [...Object.values(TransactionType)];

        const transactionMetricsPromises = transactionTypes.map(async (transactionType, i) => {
            let subtypeNames: string[] = typeSubtypes[transactionType as keyof typeof typeSubtypes];
            if (!Array.isArray(subtypeNames)) {
                subtypeNames = [subtypeNames];
            }
            if (coin.acronym == CoinEnum.SATS && transactionType == TransactionType.SEND) {
                subtypeNames = ['debit-btc-transfer-ln', 'debit-btc-transfer-ibexpay', 'debit-btc-transfer-onchain'];
            }
            if (coin.acronym == CoinEnum.SATS && transactionType == TransactionType.AUTOCONVERT) {
                subtypeNames = ['credit-btc-autoconvert-sell'];
            }
            const queryBuilder = this.transactionGroupRepository
                .createQueryBuilder('transactionGroup')
                .select('DATE(transactionGroup.createdAt)', 'date')
                .addSelect('SUM(transaction.amount)', 'total')
                .innerJoin('transactionGroup.transactions', 'transaction')
                .andWhere('transactionGroup.transactionCoin = :coin', { coin: query.coinId })
                .andWhere('transaction.subtype IN (:...subtypeNames)', { subtypeNames })
                .andWhere('transactionGroup.createdAt BETWEEN :start AND :end', {
                    start: startDate,
                    end: endDate,
                })
                .andWhere('transactionGroup.type = :type', { type: transactionType })
                .groupBy('date')
                .orderBy('date', 'ASC');

            if (query.userId) {
                queryBuilder.andWhere('transactionGroup.fromUser.id = :userId OR transactionGroup.toUser.id = :userId', {
                    userId: query.userId,
                });
            }
            const rawData = await queryBuilder.getRawMany();
            const data = [];
            const pastDate = startDate;
            pastDate.setHours(0, 0, 0, 0);
            const firstDummyDate = {
                x: pastDate.toISOString(),
                y: '0',
            };
            data.push(firstDummyDate);
            const items = rawData.map((item) => ({
                x: item.date,
                y: item.total ? item.total : 0,
            }));
            data.push(...items);
            const total = data.reduce((previous, next) => previous + parseFloat(next.y), 0);
            const toDate = new Date();
            toDate.setHours(23, 59, 59, 999);
            const secondDummyDate = {
                y: '0',
                x: endDate.toISOString(),
            };
            data.push(secondDummyDate);
            const colors = ['#F9DF38', '#F99038', '#7BF938', '#38E5F9', '#387BF9', '#7038F9', '#D038F9', '#FF0000', '#85747F', '#4E7385']; // Add more colors if there are more transaction types
            return {
                type: transactionType,
                color: colors[i],
                data: data,
                total: total,
            };
        });

        const transactionMetrics = await Promise.all(transactionMetricsPromises);

        return transactionMetrics;
    }

    async getTransactionsByUser(id: string, queries: GetTransactionsDto) {
        try {
            let dateQuery = undefined;
            if (queries.fromDate !== undefined && queries.toDate != undefined) {
                dateQuery = Between(queries.fromDate, queries.toDate);
            }
            if (queries.fromDate !== undefined && queries.toDate == undefined) {
                dateQuery = MoreThanOrEqual(queries.fromDate);
            }
            if (queries.fromDate === undefined && queries.toDate != undefined) {
                dateQuery = LessThanOrEqual(queries.toDate);
            }
            let coinQuery = undefined;
            if (queries.coinId != undefined) {
                coinQuery = Equal(queries.coinId);
            }

            let statusQuery = undefined;
            if (queries.status !== undefined) {
                statusQuery = Equal(queries.status);
            }
            let amountQuery = undefined;
            if (queries.fromAmount !== undefined && queries.toAmount != undefined) {
                amountQuery = Between(queries.fromAmount, queries.toAmount);
            }
            if (queries.fromAmount !== undefined && queries.toAmount == undefined) {
                amountQuery = MoreThanOrEqual(queries.fromAmount);
            }
            if (queries.fromAmount === undefined && queries.toAmount != undefined) {
                amountQuery = LessThanOrEqual(queries.toAmount);
            }

            const pageSize = 15;
            const currentPage = queries.page || 1;
            const offset = (currentPage - 1) * pageSize;
            const constantQueries = {
                createdAt: dateQuery,
                transactionCoin: { id: coinQuery },
                status: statusQuery,
                transactions: {
                    amount: amountQuery,
                },
                type: In(queries.types),
            };
            const note = queries.query !== undefined ? Like(`%${queries.query}%`) : '';
            const transactions = await this.transactionGroupRepository.findAndCount({
                where: [
                    {
                        ...constantQueries,
                        fromUser: { id: id },
                        note: note,
                    },
                    {
                        ...constantQueries,
                        toUser: { id: id },
                        note: note,
                    },
                ],
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
                    },
                    osmoBusiness: true,
                    fees: {
                        coin: true,
                    },
                },
            });
            const totalTransactionGroups = Math.ceil(transactions[1] / pageSize);

            return {
                data: transactions[0],
                currentPage: currentPage,
                totalPages: totalTransactionGroups,
            };
        } catch (error) {
            throw new BadRequestException('Error while fetching transactions');
        }
    }

    async getUserMetrics() {
        const [totalUsers, inactiveUsersThreeMonths, inactiveUsersSixMonths, newUsers] = await Promise.all([
            this.userRepository.count({
                where: {
                    userRole: { role: { name: 'User' } },
                },
            }),
            this.userRepository.count({
                where: {
                    lastSession: LessThan(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)),
                },
            }),
            this.userRepository.count({
                where: {
                    lastSession: LessThan(new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)),
                },
            }),
            this.userRepository.count({
                where: {
                    createdAt: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000)), // last 24hs
                },
            }),
        ]);
        return {
            totalUsers,
            newUsers,
            inactiveUsersThreeMonths,
            inactiveUsersSixMonths,
        };
    }

    async resendEmailVerification(id: string) {
        return await this.authService.sendEmailVerification({ sub: id });
    }

    async resendMobileVerification(id: string) {
        return await this.authService.sendMobileVerification({ sub: id });
    }

    async getKyc(id: string) {
        const verification = await this.kycVerificationRepository.findOne({
            relations: {
                verificationSteps: true,
            },
            where: {
                user: { id: id },
            },
        });
        if (!verification) {
            return {};
        }
        const kycUser = await this.kycService.getKycUser<MetaMapUser>(verification.verificationId);
        if (kycUser.documents.length == 0) {
            return {};
        }
        const images = kycUser.documents?.[0]?.['photos'];
        const fields = kycUser.documents[0]?.fields ?? {};
        const fieldsArray = Object.keys(fields).map((key) => {
            let separatedKey = key
                .split(/(?=[A-Z])/)
                .join(' ')
                .toLowerCase();
            separatedKey = separatedKey.charAt(0).toUpperCase() + separatedKey.slice(1);
            return {
                name: separatedKey,
                value: fields?.[key]?.value,
            };
        });
        const liveness = kycUser.steps.find((step: { id: string }) => step.id == 'liveness')?.data;
        const watchlistsSteps = kycUser.steps.find((step: { id: string }) => step.id == 'watchlists')?.data;
        const watchlists = watchlistsSteps?.map((watchlistStep: { watchlist: { name: string }; searchResult: string }) => {
            return {
                name: watchlistStep.watchlist.name,
                result: watchlistStep.searchResult,
            };
        });
        return {
            verification,
            images,
            liveness,
            watchlists,
            fields: fieldsArray,
        };
    }

    async rejectKyc(id: string) {
        const user = await this.userRepository.findOneBy({ id: id });
        if (!user) throw new BadRequestException('Invalid user');
        const verification = await this.kycVerificationRepository.findOne({
            where: {
                user: { id: id },
            },
        });
        if (!verification) throw new BadRequestException('Not verification found');
        await this.kycService.rejectValidation(verification.verificationId);
    }

    async forceVerifyKyc(id: string) {
        const user = await this.userRepository.findOneBy({ id: id });
        if (!user) throw new BadRequestException('Invalid user');
        const verification = await this.kycVerificationRepository.findOne({
            where: {
                user: { id: id },
            },
        });
        if (!verification) throw new BadRequestException('Not verification found');
        await this.kycService.forceValidation(verification.verificationId);
        const userUpdated = await this.userRepository.findOne({
            relations: { verifications: true, addresses: true },
            where: {
                id: id,
            },
        });
        if (!userUpdated) throw new BadRequestException('Invalid user');
        await this.algoliaService.saveUser(userUpdated);
    }

    async forceVerifyEmail(id: string) {
        const user = await this.userRepository.findOneBy({ id: id });
        if (!user) throw new BadRequestException('Invalid user');
        const verification = await this.verificationRepository.findOne({
            where: {
                user: { id: id },
            },
        });
        if (!verification) throw new BadRequestException('Invalid verification');
        await this.verificationRepository.update(verification.id, {
            email: true,
        });
        const userUpdated = await this.userRepository.findOne({
            relations: { verifications: true, addresses: true },
            where: {
                id: id,
            },
        });
        if (!userUpdated) throw new BadRequestException('Invalid user');
        await this.algoliaService.saveUser(userUpdated);
    }

    async forceVerifyMobile(id: string) {
        const user = await this.userRepository.findOneBy({ id: id });
        if (!user) throw new BadRequestException('Invalid user');
        const verification = await this.verificationRepository.findOne({
            where: {
                user: { id: id },
            },
        });
        if (!verification) throw new BadRequestException('Invalid verification');
        await this.verificationRepository.update(verification.id, {
            mobile: true,
        });
        const userUpdated = await this.userRepository.findOne({
            relations: { verifications: true, addresses: true },
            where: {
                id: id,
            },
        });
        if (!userUpdated) throw new BadRequestException('Invalid user');
        await this.algoliaService.saveUser(userUpdated);
    }

    async deactivateUser(id: string) {
        const user = await this.userRepository.findOneBy({ id: id });
        if (!user) throw new BadRequestException('Invalid user');
        await this.userRepository.update(id, {
            isActive: false,
        });
        const userUpdated = await this.userRepository.findOne({
            relations: { verifications: true, addresses: true },
            where: {
                id: id,
            },
        });
        if (!userUpdated) throw new BadRequestException('Invalid user');
        await this.algoliaService.saveUser(userUpdated);
    }

    async activateUser(id: string) {
        const user = await this.userRepository.findOneBy({ id: id });
        if (!user) throw new BadRequestException('Invalid user');
        await this.userRepository.update(id, {
            isActive: true,
        });
        const userUpdated = await this.userRepository.findOne({
            relations: { verifications: true, addresses: true },
            where: {
                id: id,
            },
        });
        if (!userUpdated) throw new BadRequestException('Invalid user');
        await this.algoliaService.saveUser(userUpdated);
    }

    async getUsers(data: GetUsersDto) {
        try {
            const { page } = data;
            const pageSize = 25;
            const offset = (page - 1) * pageSize;
            const query = data.query != null ? data.query.toLowerCase() : '';
            const users = await this.userRepository
                .createQueryBuilder('user')
                .innerJoinAndSelect('user.verifications', 'verifications')
                .innerJoinAndSelect('user.addresses', 'addresses')
                .where(
                    new Brackets((qb) => {
                        qb.where('user.username LIKE :query', { query: `%${query}%` })
                            .orWhere('user.email LIKE :query', { query: `%${query}%` })
                            .orWhere('user.firstName LIKE :query', { query: `%${query}%` })
                            .orWhere('user.lastName LIKE :query', { query: `%${query}%` })
                            .orWhere('user.mobile LIKE :query', { query: `%${query}%` });
                    }),
                )
                .skip(offset)
                .take(pageSize)
                .getManyAndCount();
            const totalPages = Math.ceil(users[1] / pageSize);
            return {
                data: users[0],
                page,
                totalPages: totalPages,
            };
        } catch (error) {
            throw new InternalServerErrorException();
        }
    }

    async updateUser(id: string, data: UpdateUsersDto) {
        try {
            const user = await this.userRepository.findOneBy({ id });

            if (!user) throw new NotFoundException('not found user');

            const userCard = await this.userCardModel.findOne({ userId: user.id });

            if ((data?.email !== undefined || data?.mobile !== undefined) && userCard) {
                await this.onvoService.updateCustomer({ email: data?.email, phone: data?.mobile }, userCard.customerId);
            }
            if (data.password) {
                data.password = await this.hashPassword(data.password);
            }

            await this.userRepository.update(id, {
                ...data,
                pin: data.pin === null ? null : data.pin,
            });

            const userUpdated = await this.userRepository.findOneBy({ id });
            if (!userUpdated) throw new BadRequestException('Invalid user');

            await this.algoliaService.saveUser(userUpdated);

            return userUpdated;
        } catch (error) {
            if (error instanceof QueryFailedError) {
                throw new BadRequestException(error.driverError?.detail ?? error.message);
            }
            throw new InternalServerErrorException();
        }
    }

    async hashPassword(password: string): Promise<string> {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        return [salt, hash].join('.');
    }
}
