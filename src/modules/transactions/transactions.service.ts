import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { TransactionCategory } from 'src/entities/transactionCategory.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { UserTransactionLimit } from 'src/entities/userTransactionLimit.entity';
import { Between, Brackets, In, LessThanOrEqual, Like, MoreThanOrEqual, Repository } from 'typeorm';
import { AuthUser } from '../auth/payloads/auth.payload';
import { CreateTransactionCategoryDto } from './dtos/category.dto';
import { EditTransactionDto } from './dtos/editTransaction.dto';
import { GetTransactionsDto } from './dtos/getTransaction.dto';
import { PartialBy } from 'types/global';
import { FundingTransactionLimit } from 'src/entities/fundingTransactionLimits.entity';

@Injectable()
export class TransactionsService {
    constructor(
        @InjectRepository(TransactionGroup) private transactionGroupRepository: Repository<TransactionGroup>,
        @InjectRepository(UserTransactionLimit) private userTransactionLimitRepository: Repository<UserTransactionLimit>,
        @InjectRepository(TransactionCategory) private transactionCategoryRepository: Repository<TransactionCategory>,
        @InjectRepository(FundingTransactionLimit) private fundingTransactionLimitRepository: Repository<FundingTransactionLimit>,
    ) {}

    async checkTransactionRateLimit(userId: string, transactionType: TransactionType) {
        const minutesAgo = new Date(Date.now() - 300000); // 5 minutes ago
        const transactionCount = await this.transactionGroupRepository
            .createQueryBuilder('transaction_group')
            .where('transaction_group.createdAt > :minutesAgo', { minutesAgo })
            .andWhere('transaction_group.type = :transactionType', { transactionType })
            .andWhere(
                new Brackets((qb) => {
                    qb.where('transaction_group.from_user_id = :userId', { userId }).orWhere('transaction_group.to_user_id = :userId', {
                        userId,
                    });
                }),
            )
            .getCount();
        const canPerform = transactionCount <= 3;
        if (!canPerform) throw new BadRequestException('Limit of transaction exceeded');
    }

    async getTransactionCategories(authUser: AuthUser) {
        const categories = await this.transactionCategoryRepository
            .createQueryBuilder('category')
            .select(['category.id', 'category.name', 'category.icon', 'category.color'])
            .leftJoinAndSelect('category.user', 'user')
            .where(
                new Brackets((qb) => {
                    qb.where('user.id = :id', { id: authUser.sub }).orWhere('user.id IS NULL');
                }),
            )
            .orderBy('category.name', 'ASC')
            .getMany();

        categories.forEach((category: PartialBy<TransactionCategory, 'user'> & { isMine?: boolean }) => {
            category['isMine'] = category.user ? true : false;
            delete category.user;
        });
        return categories;
    }

    async createTransactionCategory(authUser: AuthUser, body: CreateTransactionCategoryDto) {
        const category = this.transactionCategoryRepository.create({
            name: body.name,
            icon: body.icon,
            user: { id: authUser.sub },
            color: body.color,
        });
        await this.transactionCategoryRepository.insert(category);
    }

    async resetDailyLimits() {
        try {
            await this.userTransactionLimitRepository.update({}, { dailyAmassedAmount: 0 });
            await this.fundingTransactionLimitRepository.update({}, { dailyAmassedAmount: 0 });
        } catch (error) {
            throw new BadRequestException('Error while resetting daily limits');
        }
    }

    async resetMonthlyLimits() {
        try {
            await this.userTransactionLimitRepository.update({}, { monthlyAmassedAmount: 0 });
            await this.fundingTransactionLimitRepository.update({}, { monthlyAmassedAmount: 0 });
        } catch (error) {
            throw new BadRequestException('Error while resetting monthly limits');
        }
    }

    async editTransaction(id: string, body: EditTransactionDto) {
        const transactionGroup = await this.transactionGroupRepository.findOneBy({
            id: id,
        });
        if (!transactionGroup) throw new BadRequestException('Invalid transaction');
        const updateData: { note?: string; category?: { id: string } } = {};
        if (body.note != undefined) {
            updateData['note'] = body.note;
            if (body.note != '' && body.note.length == 0) {
                updateData['note'] = undefined;
            }
        }
        if (body.categoryId != undefined) {
            const category = await this.transactionCategoryRepository.findOneBy({ id: body.categoryId });
            if (!category) throw new BadRequestException('Invalid category');
            updateData['category'] = { id: body.categoryId };
        }
        await this.transactionGroupRepository.update(transactionGroup.id, updateData);
    }

    async getTransactions(authUser: AuthUser, queries: GetTransactionsDto) {
        let dateQuery = undefined;
        if (queries.fromDate !== undefined && queries.toDate !== undefined) {
            dateQuery = Between(queries.fromDate, queries.toDate);
        }
        if (queries.fromDate !== undefined && queries.toDate == undefined) {
            dateQuery = MoreThanOrEqual(queries.fromDate);
        }
        if (queries.fromDate == undefined && queries.toDate !== undefined) {
            dateQuery = LessThanOrEqual(queries.toDate);
        }

        const pageSize = 10;
        const currentPage = queries.page || 1;
        const offset = (currentPage - 1) * pageSize;
        const transactions = await this.transactionGroupRepository.findAndCount({
            where: [
                {
                    createdAt: dateQuery,
                    fromUser: { id: authUser.sub },
                    type: In(queries.types),
                    note: queries.query !== undefined ? Like(`%${queries.query}%`) : undefined,
                    category: queries.categoryId !== undefined ? { id: queries.categoryId } : undefined,
                },
                {
                    createdAt: dateQuery,
                    toUser: { id: authUser.sub },
                    type: In(queries.types),
                    note: queries.query !== undefined ? Like(`%${queries.query}%`) : undefined,
                    category: queries.categoryId !== undefined ? { id: queries.categoryId } : undefined,
                },
            ],
            skip: offset,
            take: pageSize,
            order: { createdAt: 'desc' },
            relations: {
                fromUser: true,
                toUser: true,
                transactionCoin: true,
                category: { user: true },
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
                referral: true,
            },
        });
        const totalTransactionGroups = Math.ceil(transactions[1] / pageSize);
        const transactionsWithOutUsers = transactions[0].map((transaction: TransactionGroup & { category: { isMine?: boolean } }) => {
            if (transaction.category !== null) {
                transaction.category['isMine'] = transaction.category.user ? true : false;
                return {
                    ...transaction,
                    category: {
                        ...transaction.category,
                        user: undefined,
                    },
                };
            }
            return transaction;
        });
        return {
            data: transactionsWithOutUsers,
            currentPage: currentPage,
            totalPages: totalTransactionGroups,
        };
    }
}
