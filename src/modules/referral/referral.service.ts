import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import Decimal from 'decimal.js';
import { Model } from 'mongoose';
import { MainWalletsAccount } from 'src/common/enums/main-wallets.enum';
import { Status } from 'src/common/enums/status.enum';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { TransactionSubtype } from 'src/common/enums/transactionSubtype.enum';
import { findAndLockWallet } from 'src/common/utils/find-and-lock-wallet';
import { App } from 'src/entities/app.entity';
import { Coin } from 'src/entities/coin.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { Referral } from 'src/entities/referral.entity';
import { Setting } from 'src/entities/setting.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { User } from 'src/entities/user.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { ReferralLimitTemplate } from 'src/modules/send-grid/templates/referralLimit.template';
import { PartnerInvoice } from 'src/schemas/partnerInvoice.schema';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { IsNull, LessThan, Repository } from 'typeorm';
import { SmsService } from '../../services/sms/sms.service';
import { AuthUser } from '../auth/payloads/auth.payload';
import { BalanceUpdaterService } from '../balance-updater/balance-updater.service';
import { UpdateBalanceTransferType } from '../balance-updater/enums/type.enum';
import { UpdateBalance } from '../balance-updater/interfaces/updateBalance';
import { IbexService } from '../ibex/ibex.service';
import { CoinEnum } from '../me/enums/coin.enum';
import { PartnerStatus } from '../partners/enums/partnerEvent.enum';
import { NoOsmoUserWallet } from '../partners/flows/noOsmoUserWallet.flow';
import { InvoiceReference } from '../partners/interfaces/strikeInvoiceReferece.interface';
import { PartnersService } from '../partners/partners.service';
import { MobileRoutePaths } from '../push-notification/enums/mobileRoutesPaths.enum';
import { PushNotificationService } from '../push-notification/push-notification.service';
import { SendGridService } from '../send-grid/send-grid.service';
import { OsmoReferralDto } from './dtos/osmoReferral.dto';
import { RefundReferral } from './interfaces/refund.interface';
import { FeaturesService } from '../features/features.service';
import { FeatureEnum } from 'src/common/enums/feature.enum';

@Injectable()
export class ReferralService {
    private refundQueue = `REFERRAL-REFUND-${process.env.ENV}`;
    private refundUrl = `https://${process.env.DOMAIN}/referral/refund`;
    constructor(
        @InjectRepository(Transaction) private transactionRepository: Repository<Transaction>,
        @InjectRepository(Referral) private referralRepository: Repository<Referral>,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(TransactionGroup) private transactionGroupRepository: Repository<TransactionGroup>,
        @InjectModel(PartnerInvoice.name) private partnerInvoiceModel: Model<PartnerInvoice>,
        @InjectRepository(Setting) private settingsRepository: Repository<Setting>,
        @InjectRepository(Coin) private coinRepository: Repository<Coin>,
        @InjectRepository(IbexAccount) private ibexAccountRepository: Repository<IbexAccount>,
        @InjectRepository(App) private appRepository: Repository<App>,
        private ibexService: IbexService,
        private pushNotificationService: PushNotificationService,
        private sendGridService: SendGridService,
        private partnerService: PartnersService,
        private smsService: SmsService,
        private googleTasksService: GoogleCloudTasksService,
        private featureService: FeaturesService,
    ) {}

    async refundOsmoReferralTransaction(refundReferral: RefundReferral) {
        const referral = await this.referralRepository.findOne({
            relations: {
                inviter: true,
                transactionGroup: {
                    transactionCoin: true,
                },
            },
            where: {
                id: refundReferral.invitationId,
            },
        });
        if (!referral) throw new BadRequestException('Invalid referral');

        const osmoTransaction = await this.transactionRepository.findOne({
            relations: {
                transactionGroup: true,
            },
            where: {
                transactionGroup: { id: referral.transactionGroup.id },
            },
        });
        if (!osmoTransaction) throw new BadRequestException('Invalid transaction');

        const coin = await this.coinRepository.findOneBy({ acronym: CoinEnum.USD });
        if (!coin) throw new BadRequestException('Invalid coin');

        await this.transactionGroupRepository.manager.transaction('SERIALIZABLE', async (transactionalEntityManager) => {
            const osmoReferralWallet = await findAndLockWallet({
                entityManager: transactionalEntityManager,
                coinId: coin.id,
                alias: MainWalletsAccount.REFERRAL,
            });
            if (!osmoReferralWallet) throw new BadRequestException('Invalid wallet');

            const totalAmountToRefund = new Decimal(osmoTransaction.amount);
            osmoReferralWallet.availableBalance = new Decimal(osmoReferralWallet.availableBalance).plus(totalAmountToRefund).toNumber();
            await Promise.all([
                transactionalEntityManager.save(Wallet, osmoReferralWallet),
                transactionalEntityManager.update(TransactionGroup, referral.transactionGroup.id, {
                    status: Status.FAILED,
                }),
                transactionalEntityManager.remove(Referral, referral),
            ]);
            await this.pushNotificationService.sendPushToUser(referral.inviter, {
                data: {
                    route: MobileRoutePaths.Transactions,
                },
                title: 'Invitación fallida',
                message: 'Tu invitación de referidos ha fallado',
            });
        });
    }

    async refundSmsTransaction(refundReferral: RefundReferral) {
        const referral = await this.referralRepository.findOne({
            relations: {
                inviter: true,
                transactionGroup: {
                    transactionCoin: true,
                    transactions: true,
                },
            },
            where: {
                id: refundReferral.invitationId,
            },
        });
        if (!referral) throw new BadRequestException('Invalid referral');

        await this.transactionGroupRepository.manager.transaction('SERIALIZABLE', async (transactionalEntityManager) => {
            const inviterWallet = await findAndLockWallet({
                entityManager: transactionalEntityManager,
                coinId: referral.transactionGroup.transactionCoin.id,
                userId: referral.inviter.id,
            });
            if (!inviterWallet) throw new BadRequestException('Invalid wallet');

            const invitedTransaction = referral.transactionGroup.transactions[0];
            if (!invitedTransaction) throw new BadRequestException('Invalid transaction');

            inviterWallet.availableBalance = new Decimal(inviterWallet.availableBalance).plus(invitedTransaction.amount).toNumber();

            await Promise.all([
                transactionalEntityManager.save(Wallet, inviterWallet),
                transactionalEntityManager.update(TransactionGroup, referral.transactionGroup.id, {
                    status: Status.FAILED,
                }),
                transactionalEntityManager.remove(Referral, referral),
            ]);
            this.pushNotificationService.sendPushToUser(referral.inviter, {
                data: {
                    route: MobileRoutePaths.Transactions,
                },
                title: 'Invitacion Fallida',
                message: 'Tu envío por SMS ha fallado',
            });
        });
    }

    async checkExpiredInvitation() {
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        const monthAgo = new Date();
        monthAgo.setDate(fiveDaysAgo.getDate() - 30);
        const [referralsByUsers, referralsByOsmo] = await Promise.all([
            this.referralRepository.find({
                where: {
                    invited: IsNull(),
                    isOsmoSponsor: false,
                    createdAt: LessThan(fiveDaysAgo),
                },
            }),
            this.referralRepository.find({
                where: {
                    invited: IsNull(),
                    isOsmoSponsor: true,
                    createdAt: LessThan(monthAgo),
                },
            }),
        ]);
        await Promise.all(referralsByUsers.map((referral) => this.addRefundTaskToQueue(referral)));
        await Promise.all(referralsByOsmo.map((referral) => this.addRefundTaskToQueue(referral)));
    }

    private async addRefundTaskToQueue(referral: Referral) {
        const refundReferral: RefundReferral = {
            invitationId: referral.id,
            isOsmoSponsor: referral.isOsmoSponsor,
        };
        this.googleTasksService.createInternalTask(this.refundQueue, refundReferral, this.refundUrl);
    }

    async generateInvitation(authUser: AuthUser, data: OsmoReferralDto) {
        await this.featureService.checkFeatureAvailability(authUser,FeatureEnum.REFERRAL)
        const referrals = await this.referralRepository.count({
            where: {
                inviter: { id: authUser.sub },
                isOsmoSponsor: true,
            },
        });
        if (referrals >= 10) throw new BadRequestException('Limite de referral alcanzados');

        const settings = await this.settingsRepository.find();
        const user = await this.userRepository.findOneBy({ id: authUser.sub });
        if (!user) throw new BadRequestException('Invalid user');

        const coin = await this.coinRepository.findOneBy({ acronym: CoinEnum.USD });
        if (!coin) throw new BadRequestException('Invalid coin');

        await this.transactionRepository.manager.transaction('SERIALIZABLE', async (transactionalEntityManager) => {
            const osmoReferralWallet = await findAndLockWallet({
                entityManager: transactionalEntityManager,
                coinId: coin.id,
                alias: MainWalletsAccount.REFERRAL,
            });
            if (!osmoReferralWallet) throw new BadRequestException('Invalid wallet');

            if (osmoReferralWallet.availableBalance < 250) throw new BadRequestException('Sin fondos');
            const invitedRewardSetting = settings.find((setting) => setting.name === 'referralInvitedReward');
            if (!invitedRewardSetting) throw new BadRequestException('Invalid Reward setting');

            const invitedReward = new Decimal(invitedRewardSetting.value);

            const amountToDebit = invitedReward.toNumber();
            await transactionalEntityManager.update(Wallet, osmoReferralWallet.id, {
                availableBalance: new Decimal(osmoReferralWallet.availableBalance).minus(amountToDebit).toNumber(),
            });

            const transactionGroup = transactionalEntityManager.create(TransactionGroup, {
                type: TransactionType.REFERRAL,
                status: Status.PENDING,
                transactionCoin: coin,
            });
            await transactionalEntityManager.insert(TransactionGroup, transactionGroup);
            const osmoTransaction = transactionalEntityManager.create(Transaction, {
                wallet: osmoReferralWallet,
                amount: amountToDebit,
                balance: osmoReferralWallet.availableBalance,
                subtype: TransactionSubtype.DEBIT_REFERRAL_OSMO,
                transactionGroup: transactionGroup,
            });
            const referral = transactionalEntityManager.create(Referral, {
                inviter: user,
                phoneNumber: data.phoneNumber,
                isOsmoSponsor: true,
                transactionGroup: transactionGroup,
            });
            await transactionalEntityManager.insert(Referral, referral);
            await transactionalEntityManager.insert(Transaction, osmoTransaction);

            this.smsService.sendFiatInvitation({
                phoneNumber: data.phoneNumber,
                amount: invitedReward.toNumber(),
                currency: 'USD',
                from: 'Osmo',
            });
        });
    }

    async referral(authUser: AuthUser) {
        const user = await this.userRepository.findOneBy({ id: authUser.sub });
        if (!user) throw new BadRequestException('Invalid user');

        if (!user.mobile) throw new BadRequestException('Invalid mobile');
        const strikeInvoice = await this.partnerInvoiceModel.findOne({
            $or: [{ phoneNumber: user.mobile }],
        });
        if (strikeInvoice) {
            this.fundStrike(strikeInvoice);
        }
        const referralUserRecord = await this.referralRepository.findOne({
            relations: {
                inviter: true,
                transactionGroup: {
                    transactions: true,
                },
            },
            where: {
                isOsmoSponsor: true,
                phoneNumber: user.mobile,
                transactionGroup: {
                    status: Status.PENDING,
                },
            },
        });

        if (referralUserRecord) {
            await this.referralByUser(user, referralUserRecord);
        }

        const referralOsmoRecord = await this.referralRepository.findOne({
            relations: {
                inviter: true,
                transactionGroup: {
                    transactions: true,
                },
            },
            where: {
                isOsmoSponsor: true,
                phoneNumber: user.mobile,
                transactionGroup: {
                    status: Status.PENDING,
                },
            },
        });
        if (referralOsmoRecord) {
            await this.referralByOsmo(user, referralOsmoRecord);
        }
    }

    private async fundStrike(partnerInvoice: PartnerInvoice) {
        const partnerStrategy = new NoOsmoUserWallet(this.userRepository.manager, partnerInvoice, this.ibexService);
        const response = await partnerStrategy.deposit();
        if (response == PartnerStatus.SUCCESS) {
            const app = await this.appRepository.findOneBy({ name: partnerInvoice.partner });
            if (!app) throw new BadRequestException('Invalid app');

            const referenceData: InvoiceReference = {
                event: PartnerStatus.SUCCESS,
                referenceId: partnerInvoice.referenceId,
                webhookURL: app.webhookURL,
                secretKey: `${app.clientId}@${app.clientSecret}`,
            };
            this.partnerService.addNotifierToQueue(referenceData);
        }
    }

    async referralByUser(user: User, referral: Referral) {
        const toUser = await this.userRepository.findOneBy({ id: user.id });
        if (!toUser) throw new BadRequestException('Invalid user');

        const invitedTransaction = referral.transactionGroup.transactions[0];
        if (!invitedTransaction) throw new BadRequestException('Invalid transaction');
        const inviterDebitTransaction = await this.transactionRepository.findOne({
            relations: {
                wallet: { coin: true, account: { user: true } },
                transactionGroup: true,
            },
            where: {
                id: invitedTransaction.id,
            },
        });
        if (!inviterDebitTransaction) throw new BadRequestException('Invalid transaction');

        const transactionGroup = await this.transactionGroupRepository.findOneBy({ id: inviterDebitTransaction.transactionGroup.id });
        if (!transactionGroup) throw new BadRequestException('Invalid transaction group');

        const entityManager = this.transactionRepository.manager;

        await entityManager.transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager.save(inviterDebitTransaction);
            const [inviterWallet, invitedWallet] = await Promise.all([
                findAndLockWallet({
                    entityManager: transactionalEntityManager,
                    coinId: inviterDebitTransaction.wallet.coin.id,
                    userId: referral.inviter.id,
                }),
                findAndLockWallet({
                    entityManager: transactionalEntityManager,
                    coinId: inviterDebitTransaction.wallet.coin.id,
                    userId: toUser.id,
                }),
            ]);
            if (!inviterWallet || !invitedWallet) throw new BadRequestException('Invalid wallets');

            await Promise.all([
                transactionalEntityManager.update(Wallet, invitedWallet.id, {
                    balance: new Decimal(invitedWallet.balance).plus(inviterDebitTransaction.amount).toNumber(),
                    availableBalance: new Decimal(invitedWallet.availableBalance).plus(inviterDebitTransaction.amount).toNumber(),
                }),
                transactionalEntityManager.update(Wallet, inviterWallet.id, {
                    balance: new Decimal(inviterWallet.balance).minus(inviterDebitTransaction.amount).toNumber(),
                }),
            ]);
            transactionGroup.toUser = toUser;
            transactionGroup.status = Status.COMPLETED;

            await transactionalEntityManager.save(transactionGroup);
            const invitedTransaction = transactionalEntityManager.create(Transaction, {
                amount: inviterDebitTransaction.amount,
                wallet: invitedWallet,
                balance: invitedWallet.availableBalance,
                transactionGroup: transactionGroup,
                subtype: TransactionSubtype.CREDIT_FIAT_TRANSFER,
            });
            referral.invited = user;
            await transactionalEntityManager.save(referral);
            await transactionalEntityManager.insert(Transaction, invitedTransaction);
            const content = user.email ?? user.mobile;
            await this.pushNotificationService.sendPushToUser(referral.inviter, {
                message: `${content} se ha registrado con tu enlace de invitación!`,
                title: 'OsmoWallet',
            });
        });
        const fromUserBalanceUpdatePayload: UpdateBalance = {
            amount: inviterDebitTransaction.amount,
            coinId: inviterDebitTransaction.wallet.coin.id,
            type: UpdateBalanceTransferType.USER_TO_OSMO,
            userId: referral.inviter.id,
        };
        const toUserBalanceUpdatePayload: UpdateBalance = {
            amount: inviterDebitTransaction.amount,
            coinId: inviterDebitTransaction.wallet.coin.id,
            type: UpdateBalanceTransferType.OSMO_TO_USER,
            userId: user.id,
        };
        await this.googleTasksService.createInternalTask(
            BalanceUpdaterService.queue,
            fromUserBalanceUpdatePayload,
            BalanceUpdaterService.url,
        );
        await this.googleTasksService.createInternalTask(
            BalanceUpdaterService.queue,
            toUserBalanceUpdatePayload,
            BalanceUpdaterService.url,
        );

        const referrals = await this.referralRepository.find({
            where: {
                inviter: {
                    id: referral.inviter.id,
                },
            },
            relations: {
                inviter: {
                    addresses: true,
                },
            },
        });

        const address = referrals.map((referral) => referral.inviter.addresses).map((address) => address.onChain);

        const accountId = process.env.IBEX_NATIVE_OSMO_ACCOUNT_ID;
        if (!accountId) throw new BadRequestException('Invalid account');

        const userData = {
            amount: 10,
            address: address.toString(),
            feeSat: 0,
            coinId: '',
        };

        if (referrals.length === 10) {
            const rewardTransactionGroup = this.transactionGroupRepository.create({});

            const entityManager = this.transactionRepository.manager;
            await entityManager.transaction(async (transactionalEntityManager) => {
                await transactionalEntityManager.save(rewardTransactionGroup);
                const [osmoWallet, inviterWallet] = await Promise.all([
                    findAndLockWallet({
                        entityManager: transactionalEntityManager,
                        coinId: inviterDebitTransaction.wallet.coin.id,
                        alias: MainWalletsAccount.MAIN,
                    }),
                    findAndLockWallet({
                        entityManager: transactionalEntityManager,
                        coinId: inviterDebitTransaction.wallet.coin.id,
                        userId: referral.inviter.id,
                    }),
                ]);
                if (!inviterWallet || !osmoWallet) throw new BadRequestException('Invalid wallets');

                await Promise.all([
                    transactionalEntityManager.update(Wallet, inviterWallet.id, {
                        balance: new Decimal(inviterWallet.balance).plus(userData.amount).toNumber(),
                        availableBalance: new Decimal(inviterWallet.availableBalance).plus(userData.amount).toNumber(),
                    }),
                    transactionalEntityManager.update(Wallet, osmoWallet.id, {
                        balance: new Decimal(osmoWallet.balance).minus(userData.amount).toNumber(),
                    }),
                ]);
                rewardTransactionGroup.toUser = referral.inviter;
                rewardTransactionGroup.status = Status.COMPLETED;

                await transactionalEntityManager.save(rewardTransactionGroup);
                const osmoDebitTransaction = transactionalEntityManager.create(Transaction, {
                    amount: userData.amount,
                    wallet: osmoWallet,
                    balance: osmoWallet.availableBalance,
                    transactionGroup: rewardTransactionGroup,
                    subtype: TransactionSubtype.DEBIT_REFERRAL_OSMO,
                });
                const inviterTransaction = transactionalEntityManager.create(Transaction, {
                    amount: userData.amount,
                    wallet: inviterWallet,
                    balance: inviterWallet.availableBalance,
                    transactionGroup: rewardTransactionGroup,
                    subtype: TransactionSubtype.CREDIT_FIAT_TRANSFER,
                });

                await transactionalEntityManager.save(Transaction, osmoDebitTransaction);
                await transactionalEntityManager.save(Transaction, inviterTransaction);
            });

            const toUserBalanceUpdatePayload: UpdateBalance = {
                amount: userData.amount,
                coinId: inviterDebitTransaction.wallet.coin.id,
                type: UpdateBalanceTransferType.OSMO_TO_USER,
                userId: user.id,
            };
            await this.googleTasksService.createInternalTask(
                BalanceUpdaterService.queue,
                toUserBalanceUpdatePayload,
                BalanceUpdaterService.url,
            );
        }
    }

    async referralByOsmo(user: User, referral: Referral) {
        const settings = await this.settingsRepository.find();
        const osmoTransaction = await this.transactionRepository.findOne({
            relations: {
                transactionGroup: { transactionCoin: true },
            },
            where: {
                transactionGroup: { id: referral.transactionGroup.id },
            },
        });
        if (!osmoTransaction) throw new BadRequestException('Invalid transaction');

        const invitedRewardSetting = settings.find((setting) => setting.name === 'referralInvitedReward');
        if (!invitedRewardSetting) throw new BadRequestException('Invalid setting');

        const invitedReward = new Decimal(invitedRewardSetting.value).toNumber();
        const coin = await this.coinRepository.findOneBy({ acronym: CoinEnum.USD });
        if (!coin) throw new BadRequestException('Invalid coin');

        await this.transactionRepository.manager.transaction('SERIALIZABLE', async (transactionalEntityManager) => {
            const [osmoReferralWallet, invitedWallet] = await Promise.all([
                findAndLockWallet({ entityManager: transactionalEntityManager, coinId: coin.id, alias: MainWalletsAccount.REFERRAL }),
                findAndLockWallet({ entityManager: transactionalEntityManager, coinId: coin.id, userId: user.id }),
            ]);
            if (!osmoReferralWallet || !invitedWallet) throw new BadRequestException('Invalid wallets');

            const transactionGroup = referral.transactionGroup;
            const osmoReferralWalletUpdate = {
                balance: new Decimal(osmoReferralWallet.balance).minus(osmoTransaction.amount).toNumber(),
            };
            const invitedWalletUpdate = {
                balance: new Decimal(invitedWallet.balance).plus(invitedReward).toNumber(),
                availableBalance: new Decimal(invitedWallet.availableBalance).plus(invitedReward).toNumber(),
            };

            await Promise.all([
                transactionalEntityManager.update(Wallet, osmoReferralWallet.id, osmoReferralWalletUpdate),
                transactionalEntityManager.update(Wallet, invitedWallet.id, invitedWalletUpdate),
            ]);
            await transactionalEntityManager.update(TransactionGroup, transactionGroup.id, {
                status: Status.COMPLETED,
                toUser: user,
            });
            const invitedTransaction = transactionalEntityManager.create(Transaction, {
                amount: invitedReward,
                balance: invitedWallet.availableBalance,
                wallet: invitedWallet,
                transactionGroup: referral.transactionGroup,
                subtype: TransactionSubtype.CREDIT_FIAT_TRANSFER,
            });
            await transactionalEntityManager.update(Referral, referral.id, {
                invited: { id: user.id },
            });

            await transactionalEntityManager.save(Transaction, [osmoTransaction, invitedTransaction, osmoTransaction]);
            const content = user.email ?? user.mobile;
            this.pushNotificationService.sendPushToUser(referral.inviter, {
                message: `${content} se ha registrado con tu enlace de invitación!`,
                title: 'Referral',
            });
            if (osmoReferralWallet.availableBalance < 250) {
                const template = new ReferralLimitTemplate(
                    [{ email: 'victor@osmowallet.com', name: 'amilkar' }],
                    'amilkar',
                    osmoReferralWallet.availableBalance,
                    coin.acronym,
                );
                this.sendGridService.sendMail(template);
            }
        });
        const toUserBalanceUpdatePayload: UpdateBalance = {
            amount: invitedReward,
            coinId: osmoTransaction.transactionGroup.transactionCoin.id,
            type: UpdateBalanceTransferType.OSMO_TO_USER,
            userId: user.id,
        };
        this.googleTasksService.createInternalTask(BalanceUpdaterService.queue, toUserBalanceUpdatePayload, BalanceUpdaterService.url);
    }
}
