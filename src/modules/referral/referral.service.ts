import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from 'src/entities/transaction.entity';
import { IsNull, LessThan, Repository } from 'typeorm';
import { Setting } from 'src/entities/setting.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { CoinEnum } from '../me/enums/coin.enum';
import { ReferralLimitTemplate } from 'src/modules/send-grid/templates/referralLimit.template';
import { User } from 'src/entities/user.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { Referral } from 'src/entities/referral.entity';
import { SendGridService } from '../send-grid/send-grid.service';
import { IbexService } from '../ibex/ibex.service';
import { Coin } from 'src/entities/coin.entity';
import { OsmoReferralDto } from './dtos/osmoReferral.dto';
import { SmsService } from '../../services/sms/sms.service';
import { PartnersService } from '../partners/partners.service';
import { NoOsmoUserWallet } from '../partners/flows/noOsmoUserWallet.flow';
import { PartnerStatus } from '../partners/enums/partnerEvent.enum';
import { InvoiceReference } from '../partners/interfaces/strikeInvoiceReferece.interface';
import { RefundReferral } from './interfaces/refund.interface';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PartnerInvoice } from 'src/schemas/partnerInvoice.schema';
import { App } from 'src/entities/app.entity';
import { Status } from 'src/common/enums/status.enum';
import Decimal from 'decimal.js';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { AuthUser } from '../auth/payloads/auth.payload';
import { PushNotificationService } from '../push-notification/push-notification.service';
import MobileRoutePaths from '../push-notification/enums/mobileRoutesPaths.enum';
import { TransactionSubtype } from 'src/common/enums/transactionSubtype.enum';
import { BalanceUpdaterService } from '../balance-updater/balance-updater.service';
import { UpdateBalance } from '../balance-updater/interfaces/updateBalance';
import { UpdateBalanceTransferType } from '../balance-updater/enums/type.enum';
import { findAndLockWallet } from 'src/common/utils/find-and-lock-wallet';
import { MainWalletsAccount } from 'src/common/enums/main-wallets.enum';

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
    const osmoTransaction = await this.transactionRepository.findOne({
      relations: {
        transactionGroup: true,
      },
      where: {
        transactionGroup: { id: referral.transactionGroup.id },
      },
    });
    const coin = await this.coinRepository.findOneBy({acronym: CoinEnum.USD})
    await this.transactionGroupRepository.manager.transaction('SERIALIZABLE',async transactionalEntityManager => {
      const osmoReferralWallet = await findAndLockWallet({entityManager: transactionalEntityManager, coinId: coin.id, alias: MainWalletsAccount.REFERRAL})

      const totalAmountToRefund = new Decimal(osmoTransaction.amount);
      osmoReferralWallet.availableBalance = new Decimal(osmoReferralWallet.availableBalance).plus(totalAmountToRefund).toNumber();
      await Promise.all([
        transactionalEntityManager.save(Wallet, osmoReferralWallet),
        transactionalEntityManager.update(TransactionGroup,referral.transactionGroup.id,
          {
            status: Status.FAILED,
          },
        ),
        transactionalEntityManager.remove(Referral, referral)
      ])
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
    await this.transactionGroupRepository.manager.transaction('SERIALIZABLE',async transactionalEntityManager => {
      const inviterWallet = await findAndLockWallet({
        entityManager: transactionalEntityManager, 
        coinId: referral.transactionGroup.transactionCoin.id, 
        userId: referral.inviter.id
      })

      inviterWallet.availableBalance = new Decimal(inviterWallet.availableBalance).plus(referral.transactionGroup.transactions[0].amount).toNumber();

      await Promise.all([
        transactionalEntityManager.save(Wallet, inviterWallet),
        transactionalEntityManager.update(
          TransactionGroup,
          referral.transactionGroup.id,
          {
            status: Status.FAILED,
          },
        ),
        transactionalEntityManager.remove(Referral, referral)
      ])
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
    await Promise.all(
      referralsByUsers.map((referral) => this.addRefundTaskToQueue(referral)),
    );
    await Promise.all(
      referralsByOsmo.map((referral) => this.addRefundTaskToQueue(referral)),
    );
  }

  private async addRefundTaskToQueue(referral: Referral) {
    const refundReferral: RefundReferral = {
      invitationId: referral.id,
      isOsmoSponsor: referral.isOsmoSponsor,
    };
    this.googleTasksService.createInternalTask(
      this.refundQueue,
      refundReferral,
      this.refundUrl,
    );
  }

  async generateInvitation(userId: string, data: OsmoReferralDto) {
    const referrals = await this.referralRepository.count({
      where: {
        inviter: { id: userId },
        isOsmoSponsor: true,
      },
    });
    if (referrals >= 10) throw new BadRequestException('Limite de referral alcanzados');
    
    const settings = await this.settingsRepository.find();
    const user = await this.userRepository.findOneBy({ id: userId });
    const coin = await this.coinRepository.findOneBy({acronym: CoinEnum.USD,});
    await this.transactionRepository.manager.transaction('SERIALIZABLE', async (transactionalEntityManager) => {
      const osmoReferralWallet = await findAndLockWallet({entityManager: transactionalEntityManager, coinId: coin.id,alias: MainWalletsAccount.REFERRAL})
      if (osmoReferralWallet.availableBalance < 250) throw new BadRequestException('Sin fondos');
      const invitedRewardSetting = settings.find((setting) => setting.name == 'referralInvitedReward',);
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

      this.smsService.sendSMS({
        message: `Acabas de recibir $${invitedReward} USD de Osmo. Descarga OsmoWallet desde https://osmowallet.com y crea tu cuenta para obtenerlos. `,
        phoneNumber: data.phoneNumber,
      });
    });
  }

  async referral(authUser: AuthUser) {
    const user = await this.userRepository.findOneBy({ id: authUser.sub });
    if(!user.mobile) return
    const strikeInvoice = await this.partnerInvoiceModel.findOne({
      $or: [
        { phoneNumber: user.mobile },
      ]
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
        isOsmoSponsor: false,
        phoneNumber: user.mobile,
        transactionGroup: {
          status: Status.PENDING,
        },
      },
    });
    if (referralUserRecord) {
      this.referralByUser(user, referralUserRecord);
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
    if(referralOsmoRecord) {
      this.referralByOsmo(user,referralOsmoRecord)
    }
  }

  private async fundStrike(partnerInvoice: PartnerInvoice) {
    const partnerStrategy = new NoOsmoUserWallet(
        this.userRepository.manager,
        partnerInvoice,
        this.ibexService,
    );
    const response = await partnerStrategy.deposit();
    if (response == PartnerStatus.SUCCESS) {
      const app = await this.appRepository.findOneBy({name: partnerInvoice.partner})
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
    const inviterDebitTransaction = await this.transactionRepository.findOne({
      relations: {
        wallet: { coin: true, account: { user: true } },
        transactionGroup: true,
      },
      where: {
        id: referral.transactionGroup.transactions[0].id,
      },
    },)
    const transactionGroup = await this.transactionGroupRepository.findOneBy({ id: inviterDebitTransaction.transactionGroup.id },);
    const entityManager = this.transactionRepository.manager;
    await entityManager.transaction(async transactionalEntityManager => {
      await transactionalEntityManager.save(inviterDebitTransaction);
      const [inviterWallet, invitedWallet] = await Promise.all([
        findAndLockWallet({entityManager: transactionalEntityManager,coinId: inviterDebitTransaction.wallet.coin.id, userId: referral.inviter.id}),
        findAndLockWallet({entityManager: transactionalEntityManager,coinId: inviterDebitTransaction.wallet.coin.id, userId: toUser.id})
      ])

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
      const content = user.email ?? user.mobile
      this.pushNotificationService.sendPushToUser(inviterDebitTransaction.wallet.account.user,{
          message: `${content} se ha registrado con tu enlace de invitación!`,
          title: 'OsmoWallet',
        },
      );
    });
    const fromUserBalanceUpdatePayload: UpdateBalance = {
      amount: inviterDebitTransaction.amount,
      coinId: inviterDebitTransaction.wallet.coin.id,
      type: UpdateBalanceTransferType.USER_TO_OSMO,
      userId: inviterDebitTransaction.wallet.account.user.id
    }
    const toUserBalanceUpdatePayload: UpdateBalance = {
      amount: inviterDebitTransaction.amount,
      coinId: inviterDebitTransaction.wallet.coin.id,
      type: UpdateBalanceTransferType.OSMO_TO_USER,
      userId: user.id
    }
    this.googleTasksService.createInternalTask(BalanceUpdaterService.queue,fromUserBalanceUpdatePayload,BalanceUpdaterService.url)
    this.googleTasksService.createInternalTask(BalanceUpdaterService.queue,toUserBalanceUpdatePayload,BalanceUpdaterService.url)
  }

  async referralByOsmo(user: User, referral: Referral) {
    const settings = await this.settingsRepository.find();
    const osmoTransaction = await this.transactionRepository.findOne({
      relations: {
        transactionGroup: {transactionCoin: true},
      },
      where: {
        transactionGroup: { id: referral.transactionGroup.id },
      },
    });
    const invitedRewardSetting = settings.find((setting) => setting.name == 'referralInvitedReward',);
    const invitedReward = new Decimal(invitedRewardSetting.value).toNumber();
    const coin = await this.coinRepository.findOneBy({acronym: CoinEnum.USD})
    await this.transactionRepository.manager.transaction('SERIALIZABLE', async (transactionalEntityManager) => {
      const [osmoReferralWallet, invitedWallet] = await Promise.all([
        findAndLockWallet({entityManager: transactionalEntityManager, coinId: coin.id, alias: MainWalletsAccount.REFERRAL}),
        findAndLockWallet({entityManager: transactionalEntityManager, coinId: coin.id, userId: user.id})
      ])
      const transactionGroup = referral.transactionGroup;
      const osmoReferralWalletUpdate = {
        balance: new Decimal(osmoReferralWallet.balance).minus(osmoTransaction.amount).toNumber()
      };
      const invitedWalletUpdate = {
        balance: new Decimal(invitedWallet.balance).plus(invitedReward).toNumber(),
        availableBalance: new Decimal(invitedWallet.availableBalance).plus(invitedReward).toNumber()
      };

      await Promise.all([
        transactionalEntityManager.update(Wallet, osmoReferralWallet.id, osmoReferralWalletUpdate),
        transactionalEntityManager.update(Wallet, invitedWallet.id, invitedWalletUpdate),
      ]);
      await transactionalEntityManager.update(TransactionGroup, transactionGroup.id, {
          status: Status.COMPLETED,
          toUser: user
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

      await transactionalEntityManager.save(Transaction, [
        osmoTransaction,
        invitedTransaction,
        osmoTransaction,
      ]);
      const content = user.email ?? user.mobile
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
      userId: user.id
    }
    this.googleTasksService.createInternalTask(BalanceUpdaterService.queue,toUserBalanceUpdatePayload,BalanceUpdaterService.url)
  }


}
