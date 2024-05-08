import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from 'src/entities/transaction.entity';
import { User } from 'src/entities/user.entity';
import { IsNull, Not, Repository } from 'typeorm';
import { IbexService } from '../ibex/ibex.service';
import { CashoutWithdrawDto } from './dtos/cashoutWithdraw.dto';
import { CsvWithdrawHelper } from './helpers/csvWithdraw.helper';
import { BankWithdraw } from './strategies/bankWithdraw.strategy';
import { CashoutWithdraw } from './strategies/cashoutWithdraw.strategy';
import { WithdrawContext } from './strategies/withdrawContext';
import { SendGridService } from '../send-grid/send-grid.service';
import { AuthUser } from '../auth/payloads/auth.payload';
import { WithdrawalMethod } from 'src/entities/withdrawalMethod.entity';
import { FeaturesService } from '../features/features.service';
import { Feature } from 'src/entities/feature.entity';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { FundingMethod } from 'src/entities/fundingMethod.entity';
import { Coin } from 'src/entities/coin.entity';
import { CashOutPayload } from './interfaces/cashout.payload';
import { OsmoBankAccount } from 'src/entities/osmoBank.entity';
import { WithdrawDto } from './dtos/withdraw.dto';
import { Withdraw } from './strategies/withdraw';
import { StableWithdraw } from './strategies/stable-withdraw.strategy';
import { Status } from 'src/common/enums/status.enum';
import { WithdrawalMethodEnum } from './enums/withdrawalMethod.enum';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { SinpeWithdraw } from './strategies/sinpe.strategy';
import { TransactionMethodEnum } from 'src/common/enums/transactionMethod.enum';
import { BankAccount } from 'src/entities/bank.account.entity';
import { TransactionSubtype } from 'src/common/enums/transactionSubtype.enum';
import { CoinsService } from '../coins/coins.service';
import { SinpeMobileWithdraw } from './strategies/sinpe-movil.strategy';
import { CashOutWithdraw } from './strategies/cash-out.strategy';
import { PushNotificationService } from '../push-notification/push-notification.service';
import { RidiviService } from 'src/services/ridivi/ridivi.service';
import { PartialBy } from '../../../types/global';
import { FeatureEnum } from 'src/common/enums/feature.enum';

@Injectable()
export class WithdrawService {
    constructor(
        @InjectRepository(Transaction) private transactionRepository: Repository<Transaction>,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(WithdrawalMethod) private withdrawalMethodRepository: Repository<WithdrawalMethod>,
        @InjectRepository(Feature) private featureRepository: Repository<Feature>,
        @InjectRepository(FundingMethod) private fundingMethodRepository: Repository<FundingMethod>,
        @InjectRepository(Coin) private coinRepository: Repository<Coin>,
        @InjectRepository(OsmoBankAccount) private osmoBankAccountRepository: Repository<OsmoBankAccount>,
        @InjectRepository(BankAccount) private bankAccountRepository: Repository<BankAccount>,
        private featureService: FeaturesService,
        private ibexService: IbexService,
        private csvWithdrawHelper: CsvWithdrawHelper,
        private sendgridService: SendGridService,
        private googleTaskService: GoogleCloudTasksService,
        private ridiviService: RidiviService,
        private coinService: CoinsService,
        private pushNotificationService: PushNotificationService,
    ) {
        //this.stableWithdraw = new StableWithdraw(this.sendgridService,body,this.userRepository.manager,user,)
        //this.generateBankWithdrawReport()
    }

    async getIbexGtqExchangeRate() {
        return await this.ibexService.getBtcExchangeRate(false);
    }

    async getWithdrawMethods(authUser: AuthUser) {
        const user = await this.userRepository.findOne({
            where: {
                id: authUser.sub,
            },
        });

        const withdrawMethods = await this.withdrawalMethodRepository.find({
            relations: {
                availableCoins: { coin: true },
            },
            where: {
                isActive: true,
                countries: {
                    isActive: true,
                    countryCode: user?.residence,
                },
            },
        });

        const withdrawMethodsModified = withdrawMethods.map(
            (method: PartialBy<WithdrawalMethod, 'availableCoins'> & { coins?: Coin[] }) => {
                method['coins'] = method.availableCoins?.map((coin) => coin.coin) ?? [];
                delete method.availableCoins;
                return method;
            },
        );

        return withdrawMethodsModified;
    }

    async generateBankWithdrawReport() {
        const currentDateTime = new Date();
        const currentDateTimeInGT = currentDateTime.toLocaleString('en-US', { timeZone: 'America/Guatemala' });
        const currentHourInGT = new Date(currentDateTimeInGT).getHours();
        if (currentHourInGT === 8 || currentHourInGT === 17) {
            const withdraws = await this.transactionRepository.find({
                relations: { transactionGroup: true, wallet: { account: { user: true } } },
                where: {
                    transactionGroup: { status: Status.PENDING, method: TransactionMethodEnum.TRANSFER, partner: IsNull() },
                    subtype: TransactionSubtype.DEBIT_FIAT_WITHDRAW,
                },
            });
            let bankAccounts: BankAccount[] = [];
            let page = 0;
            const size = 100;
            let result;
            do {
                result = await this.bankAccountRepository.find({
                    relations: {
                        bank: true,
                    },
                    where: {
                        bank: {
                            code: Not(0),
                        },
                    },
                    skip: page * size,
                    take: size,
                });
                bankAccounts = [...bankAccounts, ...result];
                page++;
            } while (result.length === size);

            if (withdraws.length > 0) {
                const osmoBankAccounts = await this.osmoBankAccountRepository.find({
                    relations: {
                        coin: true,
                    },
                });
                const template = await this.csvWithdrawHelper.createCsv(withdraws, osmoBankAccounts, bankAccounts);
                this.sendgridService.sendMail(template);
            }
        }
    }

    async withdrawInAgency(userId: string, data: CashoutWithdrawDto) {
        const strategy = new CashoutWithdraw(userId, data, this.userRepository.manager, this.ibexService, this.googleTaskService);
        const withdrawContext = new WithdrawContext(strategy);
        return await withdrawContext.withdraw();
    }

    async createWithdrawInAgencyTransaction(data: CashOutPayload) {
        const strategy = new CashoutWithdraw(
            data.user.sub,
            data.payload,
            this.userRepository.manager,
            this.ibexService,
            this.googleTaskService,
        );
        await strategy.createTransaction(data);
    }

    async withdraw(authUser: AuthUser, body: WithdrawDto) {
        await this.featureService.checkFeatureAvailability(authUser,FeatureEnum.WITHDRAW)
        const withdrawMethod = await this.withdrawalMethodRepository.findOneBy({ id: body.withdrawMethodId });
        if (!withdrawMethod) throw new BadRequestException('Invalid funding method');
        const user = await this.userRepository.findOneBy({ id: authUser.sub });
        if (!user) throw new NotFoundException('user not found');
        let strategy: Withdraw;
        switch (withdrawMethod.name) {
            case WithdrawalMethodEnum.STABLE_COIN: {
                strategy = new StableWithdraw(this.sendgridService, body, this.userRepository.manager, user);
                break;
            }
            case WithdrawalMethodEnum.SINPE: {
                strategy = new SinpeWithdraw(
                    this.userRepository.manager,
                    this.googleTaskService,
                    this.pushNotificationService,
                    user,
                    body,
                    this.ridiviService,
                    withdrawMethod,
                );
                break;
            }
            case WithdrawalMethodEnum.SINPE_MOBILE: {
                strategy = new SinpeMobileWithdraw(
                    body,
                    this.userRepository.manager,
                    user,
                    this.ridiviService,
                    this.pushNotificationService,
                    withdrawMethod,
                    this.googleTaskService,
                );
                break;
            }
            case WithdrawalMethodEnum.TRANSFER: {
                const feature = await this.featureRepository.findOneBy({ name: TransactionType.WITHDRAW });
                if (!feature) throw new NotFoundException('feature not found');

                const tierFeature = await this.featureService.getTierFeature(feature.id, authUser);
                strategy = new BankWithdraw(this.userRepository.manager, user, body, this.sendgridService, tierFeature);
                break;
            }
            case WithdrawalMethodEnum.AKISI: {
                const feature = await this.featureRepository.findOneBy({ name: TransactionType.WITHDRAW });
                if (!feature) throw new NotFoundException('feature not found');

                const tierFeature = await this.featureService.getTierFeature(feature.id, authUser);
                strategy = new CashOutWithdraw(this.userRepository.manager, user, body, tierFeature);
                break;
            }
            default:
                throw new BadRequestException('Invalid withdraw method');
        }

        const context = new WithdrawContext(strategy);
        await context.withdraw();
    }
}
