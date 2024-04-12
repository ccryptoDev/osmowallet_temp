import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Status } from 'src/common/enums/status.enum';
import { MyLogger } from 'src/common/loggers/mylogger.logger';
import { TransactionDetail } from 'src/entities/transaction.detail.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { User } from 'src/entities/user.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { WalletHistory } from 'src/entities/walletHistory.entity';
import { AlgoliaService } from 'src/services/algolia/algolia.service';
import { GoogleCloudStorageService } from 'src/services/google-cloud-storage/google-cloud-storage.service';
import { EntityManager, In, IsNull, LessThanOrEqual, Not, Repository } from 'typeorm';
import { TransactionsValidatedDto } from '../admin/admin-transactions/dtos/transactionsValidated.dto';
import { SendGridService } from '../send-grid/send-grid.service';
import {
  AccountingReportHelper,
  WalletBalance,
} from './converters/report.builder';
import { TransactionChild, TransactionMigration } from './interfaces.ts/trans.interface';
import { Coin } from 'src/entities/coin.entity';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { Transaction } from 'src/entities/transaction.entity';
import { TransactionSubtype } from 'src/common/enums/transactionSubtype.enum';
import { TransactionFee } from 'src/entities/transactionFee.entity';
import { HistoricRate } from 'src/entities/historicRates.entity';
import { UsersService } from '../users/users.service';
import { SlackService } from 'src/services/slack/slack.service';
import { SlackWebhooks } from 'src/services/slack/enums/slack-webhooks.enum';
import { createTransactionsTemplate } from 'src/services/slack/templates/transactions.template';
import { SlackChannel } from 'src/services/slack/enums/slack-channels.enum';
import { FundingMethodEnum } from '../funding/enums/fundingMethod.enum';
import { SlackEmoji } from 'src/services/slack/enums/slack-emoji.enum';
import { WithdrawalMethodEnum } from '../withdraw/enums/withdrawalMethod.enum';
import { CoinEnum } from '../me/enums/coin.enum';

interface TransactionPayload {
  transactionCoin: Coin,
  entityManager: EntityManager,
  wallets: Wallet[],
  transactionsChild: TransactionChild[],
  transactionGroup: TransactionGroup,
  fromUserId: string;
  toUserId: string
}
@Injectable()
export class AutomationService {
  private logger = new MyLogger(AutomationService.name);

  constructor(
    @InjectRepository(TransactionGroup)
    private transactionGroupRepository: Repository<TransactionGroup>,
    @InjectRepository(WalletHistory)
    private walletHistoryRepository: Repository<WalletHistory>,
    @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Coin) private coinRepository: Repository<Coin>,
    @InjectRepository(TransactionDetail) private transactionDetailRepository: Repository<TransactionDetail>,
    @InjectRepository(HistoricRate) private historicRateRepository: Repository<HistoricRate>,
    private sendGridService: SendGridService,
    private googleCloudStorageService: GoogleCloudStorageService,
    private userService: UsersService
  ) {
    //this.resign()
  }


  private createAutoconvertToSENDTransaction(data: TransactionPayload): Transaction[] {
    console.log('asdasd')
    const acronym = data.transactionsChild.find(t => t.coin != 'SATS')?.coin
    const userFiatWallet = data.wallets.find(wallet => wallet.coin.acronym === acronym && wallet.account.alias == null)
    const fromFiatWallet = data.wallets.find(wallet => wallet.coin.acronym === acronym && wallet.account.alias == null && wallet.account.user.id == data.fromUserId)
    const toUserFiatWallet = data.wallets.find(wallet => wallet.coin.acronym === acronym && wallet.account.alias == null && wallet.account.user.id == data.toUserId)

    const userBTCWallet = data.wallets.find(wallet => wallet.coin.acronym == 'SATS' && wallet.account.alias == null)
    const osmoFeeWallet = data.wallets.find(wallet => wallet.coin.acronym == acronym && wallet.account.alias == 'fees')
    const osmoFiatWallet = data.wallets.find(wallet => wallet.coin.acronym === acronym && wallet.account.alias != null)
    const transactionsChilds: TransactionChild[] = [...data.transactionsChild]
    if (data.fromUserId && data.toUserId) {
      console.log('esdta llegando proaca')
      const transactionsChild: TransactionChild = {
        amount: data.transactionsChild[0].amount,
        balance: 0,
        coin: data.transactionsChild[0].coin,
        createdAt: data.transactionsChild[0].createdAt,
        updatedAt: data.transactionsChild[0].updatedAt,
        subtype: 'credit-fiat-transfer'
      }
      transactionsChilds.push(transactionsChild)
    }
    const transactions: Transaction[] = transactionsChilds.map(t => {
      let wallet: Wallet
      switch (t.subtype) {
        case (TransactionSubtype.DEBIT_BTC_TRANSFER_LN):
          wallet = userBTCWallet; break;
        case (TransactionSubtype.DEBIT_BTC_TRANSFER_ONCHAIN):
          wallet = userBTCWallet; break;
        case (TransactionSubtype.CREDIT_BTC_TRANSFER_LN):
          wallet = userBTCWallet; break;
        case (TransactionSubtype.DEBIT_FIAT_BUY):
          wallet = userFiatWallet; break;
        case (TransactionSubtype.FEE_BUY):
          wallet = osmoFeeWallet; break;
        case (TransactionSubtype.FEE_SELL):
          wallet = osmoFeeWallet; break;
        case (TransactionSubtype.CREDIT_FIAT_SELL):
          wallet = userFiatWallet; break;
        case (TransactionSubtype.DEBIT_BTC_SELL):
          wallet = userBTCWallet; break;
        case (TransactionSubtype.CREDIT_BTC_BUY):
          wallet = userBTCWallet; break;
        case (TransactionSubtype.CREDIT_FIAT_FUNDING):
          wallet = userFiatWallet; break;
        case (TransactionSubtype.CREDIT_FIAT_FUNDING_OSMO):
          wallet = osmoFiatWallet; break;
        case (TransactionSubtype.DEBIT_FIAT_WITHDRAW):
          wallet = userFiatWallet; break;
        case (TransactionSubtype.DEBIT_FIAT_WITHDRAW_OSMO):
          wallet = osmoFiatWallet; break;
        case (TransactionSubtype.FEE_WITHDRAW):
          wallet = osmoFeeWallet; break;
        case (TransactionSubtype.FEE_AUTOCONVERT_SELL):
          wallet = osmoFeeWallet; break;
        case (TransactionSubtype.CREDIT_BTC_AUTOCONVERT_SELL):
          wallet = userBTCWallet; break;
        case (TransactionSubtype.DEBIT_FIAT_TRANSFER):
          wallet = fromFiatWallet; break;
        case (TransactionSubtype.CREDIT_FIAT_TRANSFER):
          wallet = toUserFiatWallet; break;
        case (TransactionSubtype.DEBIT_BTC_WITHDRAW_CASHOUT):
          wallet = userBTCWallet; break;
      }
      console.log(wallet)
      return data.entityManager.create(Transaction, {
        amount: t.amount,
        balance: 0,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        subtype: t.subtype,
        transactionGroup: data.transactionGroup,
        wallet: { id: wallet.id },
      })
    })
    return transactions
  }

  async createOldTransaction(data: TransactionMigration) {
    // return await this.transactionGroupRepository.findOne({
    //   relations: {toUser: true, fromUser: true, transactionCoin: true, transactions: true,},
    //   where: {
    //     id: 'b0800ff3-8070-497a-adfb-a6f499a586ef'
    //   }
    // })
    try {
      const coins = await this.coinRepository.find()
      const transactionCoin: Coin = coins.find(coin => coin.acronym == data.transactionCoin)
      const lastHistoricRate = (
        await this.historicRateRepository.find({
          order: { id: 'DESC' },
          take: 1,
        })
      )[0];
      let fromUser: User = null
      let toUser: User = null
      let fromUserId = null
      let toUserId = null
      if (data.fromUser) {
        fromUser = await this.userRepository.findOneBy({ id: data.fromUser })
        if (fromUser) {
          fromUserId = fromUser.id
        }
      }
      if (data.toUser) {
        toUser = await this.userRepository.findOneBy({ id: data.toUser })
        if (toUser) {
          toUserId = toUser.id
        }
      }

      await this.walletHistoryRepository.manager.transaction(async entityManager => {
        const wallets = await entityManager.find(Wallet, {
          relations: { coin: true, account: { user: true } },
          where: [
            {
              account: [
                {
                  user: { id: fromUserId }
                },
                {
                  user: { id: toUserId }
                }
              ]
            },
            {
              account: {
                alias: In(['main', 'fees']),
              }
            }
          ]
        })
        const transactionGroup = entityManager.create(TransactionGroup, {
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          status: Status[data.status],
          btcPrice: data.btcPrice,
          transactionCoin: transactionCoin,
          type: TransactionType[data.type],
          fromUser: fromUser,
          toUser: toUser,
          note: data.note,
          metadata: data.metadata,
          historicRate: lastHistoricRate
        })
        const tPayload: TransactionPayload = {
          entityManager: entityManager,
          transactionCoin: transactionCoin,
          transactionGroup: transactionGroup,
          transactionsChild: data.transactions,
          wallets: wallets,
          fromUserId: fromUserId,
          toUserId: toUserId
        }

        await entityManager.insert(TransactionGroup, transactionGroup)
        console.log('llego')

        const transactions = this.createAutoconvertToSENDTransaction(tPayload)
        await entityManager.insert(Transaction, transactions)
        if (data.fees.length > 0) {
          const fees: TransactionFee[] = data.fees.map(fee => {
            return entityManager.create(TransactionFee, {
              amount: fee.amount,
              coin: coins.find(coin => coin.acronym == fee.coin),
              transactionGroup: transactionGroup
            })
          })
          await entityManager.insert(TransactionFee, fees)
        }

      })
    } catch (error) {
      console.log(error)
      console.log(data)
      throw new BadRequestException()
    }
  }

  async generateMonthlyBalancesCopy() {
    const batchSize = 500;
    let offset = 0;
    let wallets = [];
    const walletsToWrite: Array<WalletBalance> = [];
    const date = new Date();
    const reportMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);

    do {
      wallets = await this.walletRepository
        .createQueryBuilder('wallet')
        .leftJoinAndSelect('wallet.coin', 'coin')
        .leftJoinAndSelect('wallet.account', 'account')
        .leftJoinAndSelect('account.user', 'user')
        .leftJoinAndSelect('user.nit', 'nit')
        .select([
          'wallet.id',
          'coin.acronym',
          'wallet.availableBalance',
          'wallet.balance',
          'wallet.createdAt',
          'user.id',
          'account.alias',
          'user.firstName',
          'user.lastName',
          'nit.nit',
        ])
        .skip(offset)
        .take(batchSize)
        .getRawMany();
      const walletHistories = wallets.map((wallet) => {
        return this.walletHistoryRepository.create({
          availableBalance: wallet.wallet_available_balance,
          balance: wallet.wallet_balance,
          date: reportMonth,
          wallet: { id: wallet.wallet_id },
        });
      });
      await this.walletHistoryRepository.insert(walletHistories);
      offset += batchSize;

      wallets.forEach((wallet) => {
        wallet.reportMonth = reportMonth;
        walletsToWrite.push(wallet);
      });
    } while (wallets.length === batchSize);
    const template =
      await AccountingReportHelper.generateReportTemplate(walletsToWrite);
    this.sendGridService.sendMail(template);
  }

  async resign() {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 1);
    const expiry = Date.now() + 3600 * 1000 * 24 * 7;
    const users = await this.userRepository.find({
      where: {
        profilePicturePath: Not(IsNull()),
        profilePictureExpiry: LessThanOrEqual(expiryDate),
      },
      select: {
        id: true,
        profilePicturePath: true,
      },
    });
    const transactionDetails = await this.transactionDetailRepository.find({
      where: {
        proofExpiry: LessThanOrEqual(expiryDate),
        proofPath: Not(IsNull())
      },
      select: {
        proofUrl: true,
        proofExpiry: true,
        proofPath: true,
        id: true,
      },
    });


    if (users.length > 0) {
      await Promise.all(users.map((user) => this.resignProfilePictures(user, expiry)),);
      const usersUpdated = await this.userRepository.find({
        relations: {
          verifications: true,
        },
        where: {
          id: In(users.map((user) => user.id)),
        },
      });
      await Promise.all(usersUpdated.map((user) => this.userService.indexUser(user.id)),);
    }

    if (transactionDetails.length > 0) {
      await Promise.all(
        transactionDetails.map((transactionDetail) =>
          this.resignProofPictures(transactionDetail, expiry),
        ),
      );
    }
  }

  async resignProfilePictures(user: User, expiry: number) {
    const newUrlSigned = await this.googleCloudStorageService.getSignedUrl(
      user.profilePicturePath,
      expiry,
    );
    await this.userRepository.update(user.id, {
      profilePicture: newUrlSigned,
      profilePictureExpiry: new Date(expiry),
    });
  }

  async resignProofPictures(transactionDetail: TransactionDetail, expiry: number) {
    const newUrlSigned = await this.googleCloudStorageService.getSignedUrl(transactionDetail.proofPath, expiry);
    await this.transactionDetailRepository.update(transactionDetail.id, {
      proofExpiry: new Date(expiry),
      proofUrl: newUrlSigned,
    });
  }

  async transactionsValidated({ transactions }: TransactionsValidatedDto) {
    const transactionsGroupIds = transactions
      .filter((transaction) => transaction.status === Status.PRE_APPROVED)
      .map((transaction) => transaction.id);

    const result = await this.transactionGroupRepository.update(
      {
        id: In(transactionsGroupIds),
      },
      { status: Status.PRE_APPROVED },
    );

    this.logger.log('Funding Transactions affected: ' + result.affected);

    return;
  }
}
