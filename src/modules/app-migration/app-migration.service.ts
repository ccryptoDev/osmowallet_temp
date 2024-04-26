import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { createObjectCsvWriter } from 'csv-writer';
import { CsvWriter } from 'csv-writer/src/lib/csv-writer';
import { ObjectMap } from 'csv-writer/src/lib/lang/object';
import * as admin from 'firebase-admin';
import { FeatureEnum } from 'src/common/enums/feature.enum';
import { Status } from 'src/common/enums/status.enum';
import { getKycDocumentNumber } from 'src/common/utils/kyc-document-number.util';
import { Account } from 'src/entities/account.entity';
import { Address } from 'src/entities/address.entity';
import { Autoconvert } from 'src/entities/autoconvert.entity';
import { BankAccount } from 'src/entities/bank.account.entity';
import { Coin } from 'src/entities/coin.entity';
import { Feature } from 'src/entities/feature.entity';
import { FundingMethod } from 'src/entities/fundingMethod.entity';
import { FundingTransactionLimit } from 'src/entities/fundingTransactionLimits.entity';
import { HistoricRate } from 'src/entities/historicRates.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { KycVerification } from 'src/entities/kycVerification.entity';
import { KycVerificationStep } from 'src/entities/kycVerificationStep.entity';
import { OsmoBusinessBpt } from 'src/entities/osmoBusinessBPT.entity';
import { Period } from 'src/entities/period.entity';
import { Preference } from 'src/entities/preference.entity';
import { RecurrentBuy } from 'src/entities/recurrent.buy.entity';
import { Role } from 'src/entities/role.entity';
import { UserRole } from 'src/entities/roleUser.entity';
import { Tier } from 'src/entities/tier.entity';
import { TierUser } from 'src/entities/tierUser.entity';
import { User } from 'src/entities/user.entity';
import { UserTransactionLimit } from 'src/entities/userTransactionLimit.entity';
import { Verification } from 'src/entities/verification.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { Readable } from 'stream';
import { In, IsNull, Like, Not, Repository } from 'typeorm';
import * as xlsx from 'xlsx';
import { GoogleCloudStorageService } from '../../services/google-cloud-storage/google-cloud-storage.service';
import { IbexService } from '../ibex/ibex.service';
import { KycStep } from '../kyc/enums/kycStep.enum';
import { KycService } from '../kyc/kyc.service';
import { CoinEnum } from '../me/enums/coin.enum';
import { CryptoCoinPreference } from '../me/enums/cryptoCoinPreference.enum';
import { FiatCoinPreference } from '../me/enums/fiatCoinPreference.enum';
import { LNMSResponse } from '../username-ms/models/accountResponse';
import { UsernameMsService } from '../username-ms/username-ms.service';

export interface RehiveUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  account: string;
  createdAt: number;
  updateAt: number;
  lastSession: number;
  isMobileVerified: boolean;
  isEmailVerified: boolean;
  isKycVerified: boolean;
}

export interface UserBalance {
  gtqBalance: number;
  usdBalance: number;
  satsBalance: number;
}

export interface RehiveUserIbexAccount {
  accountId: string;
  name: string;
}

export interface RehiveUserPreference {
  fiatCoin: string;
  cryptoCoin: string;
}

export interface RehiveRecurrentBuy {
  amount: number;
  created: any;
  currency: string;
  period: string;
  time: string;
}

export interface RehiveAccount {
  balance: number;
  available_balance: number;
  currency: {
    code: string;
    display_code: string;
    description: string;
    symbol: string;
    unit: string;
    divisibility: number;
    icon: string;
  };
  account: {
    reference: string;
    name: string;
    label: string;
    primary: boolean;
  };
  user: {
    id: string;
    username: string;
    email: string;
    mobile: string;
    first_name: string;
    last_name: string;
    profile: any;
    groups: Array<{
      name: string;
      label: string;
      section: string;
    }>;
    temporary: boolean;
  };
  active: boolean;
  created: number;
  updated: number;
}


export interface RehiveBalance {
  user?: {
    id: string;
    username: string;
    email: string;
    mobile: string;
    first_name: string;
    last_name: string;
    profile: string;
    temporary: boolean;
  };
  currencies: Array<{
    balance: number;
    available_balance: number;
    currency: {
      code: string;
      display_code: string;
      description: string;
      symbol: string;
      unit: string;
      divisibility: number;
      icon: string;
    };
    active: boolean;
  }>;
}

export interface NONIbexAccount {
  id: string
  firstName: string
  lastName: string
  email: string
}



@Injectable()
export class AppMigrationService {

  private features: Feature[];
  private coins: Coin[];
  private role: Role;
  private period: Period;
  private kycSteps: KycStep[];
  private periods: Period[];
  private accounts: RehiveAccount[];
  private balances: RehiveBalance[] = [];
  private users: [] = [];
  private tier: Tier;
  private usersNONIbexAccount: NONIbexAccount[] = []
  private csvWriter: CsvWriter<ObjectMap<any>>
  private usernames: LNMSResponse[] = []
  constructor(
    @InjectRepository(Tier) private tierRepository: Repository<Tier>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    @InjectRepository(FundingTransactionLimit) private fundingTransactionLimitRepository: Repository<FundingTransactionLimit>,
    @InjectRepository(FundingMethod) private fundingMethodRepository: Repository<FundingMethod>,
    @InjectRepository(Coin) private coinRepository: Repository<Coin>,
    @InjectRepository(Feature) private featureRepository: Repository<Feature>,
    @InjectRepository(Period) private periodRepository: Repository<Period>,
    @InjectRepository(OsmoBusinessBpt)
    private osmoBusinessRepository: Repository<OsmoBusinessBpt>,
    @InjectRepository(KycVerificationStep)
    private kycVerificationStep: Repository<KycVerificationStep>,
    @InjectRepository(KycVerification)
    private kycVerificationRepository: Repository<KycVerification>,
    @InjectRepository(RecurrentBuy)
    private recurrentBuyRepository: Repository<RecurrentBuy>,
    @InjectRepository(Address) private addressRepository: Repository<Address>,
    private ibexService: IbexService,
    private googleCloudStorageService: GoogleCloudStorageService,
    private usernameService: UsernameMsService,
    @InjectRepository(IbexAccount) private ibexAccountRepository: Repository<IbexAccount>,
    private kycService: KycService,
    private googleCloudTaskService: GoogleCloudTasksService,
    @InjectRepository(HistoricRate) private historicRateRepository: Repository<HistoricRate>,
    @InjectRepository(BankAccount) private bankAccountRepository: Repository<BankAccount>,
  ) {
    admin.initializeApp({
      credential: admin.credential.cert({
        clientEmail: process.env.GCLOUD_CLIENT_EMAIL,
        projectId: process.env.GCLOUD_PROJECT_ID,
        privateKey: process.env.GCLOUD_PRIVATE_KEY.replace(/\\n/gm, '\n'),
      }),
    });
    this.csvWriter = createObjectCsvWriter({
      path: 'migrationData.csv',
      header: [
        { id: 'id', title: 'USER_ID' },
        { id: 'username', title: 'USERNAME' },
        { id: 'firstName', title: 'FIRST_NAME' },
        { id: 'lastName', title: 'LAST_NAME' },
        { id: 'email', title: 'EMAIL' },
      ],
    });

    //this.storeBPT();
    //this.runMigration()
    //this.createIbexAddress()
    //this.updateDocumentNumber()
    //this.createAccount()
    //this.createUsernames()
    //this.generateUsernames()
    //this.syncVerifications()
    //this.syncBankAccounts()
  }
  private balancePage = 1;
  private userPage = 1;
  private userNumber = 1;
  private rehiveBaseURL = 'https://api.rehive.com/3/admin';
  private rehiveToken = '';
  private CREATE_IBEX_ADDRESS_QUEUE = `CREATE-IBEX-ADDRESS-${process.env.ENV}`
  private CREATE_IBEX_ADDRESS_URL = `https://${process.env.DOMAIN}/ibex/addresses`


  private CREATE_USERNAME_ADDRESS_QUEUE = `CREATE-IBEX-USERNAME-ADDRESS-${process.env.ENV}`
  private CREATE_USERNAME_ADDRESS_URL = `https://${process.env.DOMAIN}/ibex/usernames`

  async syncBankAccounts() {
    const nullBankAccounts = await this.bankAccountRepository.find({
      relations: {
        user: true
      },
      where: {
        accountHolder: ''
      }
    })
    for (const account of nullBankAccounts) {
      console.log(`${account.user.firstName} ${account.user.lastName}`)
      await this.bankAccountRepository.update(account.id, { accountHolder: `${account.user.firstName} ${account.user.lastName}` });
    }
  }

  async syncVerifications() {
    // const user = await this.userRepository.findOneBy({id: 'bd14ffbe-e4bb-48e6-aa76-117152051afd'})
    // const toCoinId = 'f613a650-cc43-42ab-837e-187961f855e0'
    // const sats = 81956
    // const feeAmount = 7.93
    // const fiatAmount = 388.80
    // await this.userRepository.manager.transaction(async entityManager => {
    //   const transactionGroup = entityManager.create(TransactionGroup, {
    //     fromUser: { id: user.id },
    //     type: TransactionType.AUTOCONVERT,
    //     transactionCoin: {id: toCoinId},
    //     btcPrice: 61589.04,
    //     status: Status.COMPLETED,
    //   });
    //   console.log('paso')
    //   await entityManager.insert(TransactionGroup, transactionGroup);

    //   const creditOsmoFeeTransaction = entityManager.create(Transaction, {
    //     amount: feeAmount,
    //     wallet: { id: '5b05e2eb-a01c-4f6e-aee9-58fec1ec0fa6' },
    //     balance: 0,
    //     subtype: TransactionSubtype.FEE_AUTOCONVERT_SELL,
    //     transactionGroup: transactionGroup,
    //   });

    //   const userBtcCreditTransaction = entityManager.create(Transaction, {
    //     amount: sats,
    //     balance: 0,
    //     wallet: { id: '32de0af5-7b98-4589-8fa5-a4484b82d2e5' },
    //     subtype: TransactionSubtype.CREDIT_BTC_AUTOCONVERT_SELL,
    //     transactionGroup: transactionGroup,
    //   });

    //   const userFiatCreditTransaction = entityManager.create(Transaction, {
    //     amount: fiatAmount,
    //     wallet: { id: '792f86a3-542f-4cda-acd9-0c152408933a' },
    //     balance: 0,
    //     subtype: TransactionSubtype.CREDIT_FIAT_SELL,
    //     transactionGroup: transactionGroup,
    //   });
    //   const fee = entityManager.create(TransactionFee, {
    //     coin: {id: toCoinId},
    //     amount: feeAmount,
    //     transactionGroup: transactionGroup,
    //   });
    //   await entityManager.save([
    //     creditOsmoFeeTransaction,
    //     userBtcCreditTransaction,
    //     userFiatCreditTransaction,
    //   ]);
    //   await entityManager.insert(TransactionFee, fee);
    // });
  }

  async generateUsernames() {
    const usersWithoutUsernames = await this.userRepository.find({
      where: {
        username: IsNull(),
      },
    });

    for (const user of usersWithoutUsernames) {
      const generatedUsername = `user${this.userNumber++}`;
      user.username = generatedUsername;
      await this.userRepository.save(user);
      console.log(`Generated username ${generatedUsername} for user ID ${user.id}`);
    }
  }

  async createUsernames() {
    const ibexAccounts = await this.ibexAccountRepository.find({
      take: 100,
      relations: { user: true },
      where: {
        usernameId: IsNull(),
        user: {
          username: Not(IsNull())
        }
      },
    });
    console.log(ibexAccounts.length)
    // for (const ibexAccount of ibexAccounts) {
    //   const usernameBody: CreateIbexUsernameDto = {
    //     accountId: ibexAccount.id,
    //     ibexAccountId: ibexAccount.account,
    //     userId: ibexAccount.user.id,
    //   };

    //   this.googleCloudTaskService.createInternalTask(
    //     this.CREATE_USERNAME_ADDRESS_QUEUE,
    //     usernameBody,
    //     this.CREATE_USERNAME_ADDRESS_URL
    //   );
    // }
    //console.log(ibexAccounts);
  }

  async loadAccounts() {
    const url = 'https://storage.googleapis.com/platform-storage/company/6439/exports/fc9cdefc-eff9-446e-a258-924e16ee494b_pg2_ct13774_1698264189339.json?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=platform-media%40rehive-core.iam.gserviceaccount.com%2F20231025%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20231025T231828Z&X-Goog-Expires=3600&X-Goog-SignedHeaders=host&X-Goog-Signature=1257bbb788e1d605a140aa524a98ab50a06ae6404373ae15e3118b1df8eedaa0089082b0449aebb7a33f41aed5219bfd8ba9b3d798719483e409346d5d2eebfe8125c03e9cc2c18f3b81d9cdf1282303ceb9b1eeec6584de3556bfa6a12ffd44982297dc414a6dd18ad78655e866374710849323820774bf2b4cd64929a0f6ed9f745f9f85d2571a90b97dc1815973163c5346d7f15b2271d858ab9eed10d23fcb47a7af6c562e2cb22c712dd9b895f80c2ee4383457762dd366392745d5d97572adaef99f10b03ee255c63fa199010f94ef9c4016531511c731429846a3323c4f7c8176c000a61dadb27f6fab51534e62ca3791b63cea8bc68e34fdbcee9895'
    try {
      const response = await axios.get(url);
      this.accounts = response.data;
      this.accounts = this.accounts.filter(account => account.user !== null);
    } catch (error) {
      console.error(error);
    }
  }

  async storeBPT() {
    try {
      const file = xlsx.readFile('src/bpts.xlsx');
      const data = [];
      const sheets = file.SheetNames;
      for (let i = 0; i < sheets.length; i++) {
        const temp = xlsx.utils.sheet_to_json(file.Sheets[file.SheetNames[i]]);
        temp.forEach((res) => {
          data.push(res);
        });
      }
      const chunkSize = 10;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        const bpts = await Promise.all(chunk.map((bpt) => this.createBpt(bpt)));
        await this.osmoBusinessRepository.insert(bpts);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      return data;
    } catch (err) {
      console.log(err);
    }
  }

  async createBpt(data: any): Promise<OsmoBusinessBpt> {
    const logo = await this.getFileBytes(data);
    const bpt = this.osmoBusinessRepository.create({
      bptName: data['BPT Name'],
      name: data['Nombre comercio'],
      url: data['Dirección BPT'],
      logo: logo['logo'],
    });
    return bpt;
  }

  async getFileBytes(data: any) {
    const url = data['link logo'];
    const nulled = {
      logo: null,
    };
    try {
      if (url == undefined) return nulled;
      if (!url.toString().startsWith('https://')) {
        return nulled;
      }
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
      });

      const returnedB64 = Buffer.from(response.data).toString('base64');
      const fileName = data['BPT Name'];
      const path = `${fileName}.jpeg`;
      const buffer = Buffer.from(returnedB64, 'base64');
      await this.googleCloudStorageService.saveFile(
        {
          buffer,
          originalname: fileName,
          mimetype: 'image/jpeg',
          fieldname: '',
          encoding: '',
          size: 0,
          stream: new Readable(),
          destination: '',
          filename: '',
          path: '',
        },
        path,
      );
      const logoUrl = this.googleCloudStorageService.getPublicUrl('osmo-bpts', path);
      return {
        logo: logoUrl,
      };
    } catch (error) {
      return nulled;
    }
  }

  private async getRehiveUserBalances() {
    const headers = {
      Authorization: 'Token ' + this.rehiveToken,
    };

    const url = this.rehiveBaseURL + '/accounts/?page_size=250';
    let data = await axios
      .get(url, {
        headers: headers,
      }).then((response) => response.data.data).catch((error) => console.log(error));
    Array.prototype.push.apply(this.balances, data.results);
    while (data.next != null) {
      this.balancePage++;
      console.log(`Pasando Balance ${this.balancePage}`);
      data = await axios
        .get(data.next, { headers: headers })
        .then((response) => response.data.data)
        .catch((error) => console.log(error.response.data));
      Array.prototype.push.apply(this.balances, data.results);
    }
  }

  private async getUserBalances(
    rehiveUser: RehiveUser,
    ibexAccount: RehiveUserIbexAccount,
  ): Promise<UserBalance> {
    try {
      if (ibexAccount != null) {
        const userBalances = this.balances.find(balance => balance.user?.id == rehiveUser.id)
        const usdBalance = userBalances.currencies.find(currency => currency.currency.code == 'USD').available_balance / 100
        const gtqBalance = userBalances.currencies.find(currency => currency.currency.code == 'GTQ').available_balance / 100

        const ibexAccountDetails = await this.ibexService.getAccountDetails(
          ibexAccount.accountId,
        );
        let satsBalance = 0
        if (!(ibexAccountDetails && ibexAccountDetails.balance >= 0)) {
          console.log('NO SATS FOUND', rehiveUser.email)
        } else {
          satsBalance = ibexAccountDetails.balance / 1000
        }
        return {
          gtqBalance: gtqBalance,
          usdBalance: usdBalance,
          satsBalance: satsBalance,
        };
      } else {
        console.log(`${rehiveUser.email} no tiene ibexAccount`);
      }
    } catch (error) {
      console.log(`rehiveUserId: ${rehiveUser.id}` + error)
    }

  }

  async getRecurrentBuys(
    rehiveUser: RehiveUser,
  ): Promise<RehiveRecurrentBuy[]> {
    const recurrentBuy = await admin
      .firestore()
      .collection('RecurrentBuys')
      .where('userId', '==', rehiveUser.id)
      .get();
    if (recurrentBuy.docs.length > 0) {
      const data: RehiveRecurrentBuy[] = recurrentBuy.docs.map((doc) => {
        const createdTimestamp = doc.data()['created'];
        const createdDate = new Date(createdTimestamp.seconds * 1000);
        createdDate.setUTCSeconds(0);
        createdDate.setUTCMilliseconds(0);
        const timeString = createdDate
          .toISOString()
          .split('T')[1]
          .split('.')[0];
        return {
          amount: doc.data()['amount'],
          currency: doc.data()['currency'],
          period: doc.data()['period'],
          created: createdDate,
          time: timeString,
        };
      });
      return data;
    }
    return [];
  }

  async getPreferences(rehiveUser: RehiveUser): Promise<RehiveUserPreference> {
    const preferences = await admin
      .firestore()
      .collection('Preferences')
      .doc(rehiveUser.id)
      .get();
    if (preferences.data() != undefined) {
      return {
        fiatCoin: preferences.data()['strCoin'],
        cryptoCoin: preferences.data()['strCriptoCoin'],
      };
    }
  }

  async getIbexAccount(rehiveUser: RehiveUser): Promise<RehiveUserIbexAccount> {
    const ibexAccount = await admin
      .firestore()
      .collection('IbexAccounts')
      .where('id', '==', rehiveUser.id)
      .get();
    if (ibexAccount.docs.length > 0) {
      return {
        accountId: ibexAccount.docs[0].data()['accountId'],
        name: rehiveUser.id,
      };
    } else {
      const ibexAccountResponse = await this.ibexService.createAccount(rehiveUser.id)
      await admin
        .firestore()
        .collection('IbexAccounts')
        .add({
          accountId: ibexAccountResponse.id,
          name: ibexAccountResponse.name,
          id: rehiveUser.id
        });
      return {
        accountId: ibexAccountResponse.id,
        name: ibexAccountResponse.name
      }
    }
  }

  async getVerification(rehiveUser: RehiveUser) {
    const response = await admin
      .firestore()
      .collection('Metamap')
      .where('user_id', '==', rehiveUser.id)
      .get();
    if (response.docs.length > 0) {
      return response.docs[0].data();
    }
  }

  async creteUserData(
    rehiveUser: RehiveUser,
    userBalance: UserBalance,
    oldIbexAccount: RehiveUserIbexAccount,
    verification: any,
    preferences: RehiveUserPreference,
    recurrentBuys: RehiveRecurrentBuy[],
  ) {
    const fundingFeature = this.features.find(
      (feature) => feature.name == FeatureEnum.FUNDING,
    );
    const withdrawFeature = this.features.find(
      (feature) => feature.name == FeatureEnum.WITHDRAW,
    );
    const customLNUsername = this.usernames.find(username => username.username == rehiveUser.username)
    try {
      await this.userRepository.manager.transaction(async entityManager => {
        let residence = 'GT';
        let nationatility: string = null;
        if (verification != undefined) {
          if ('nacionality' in verification) {
            residence = verification['nacionality'];
            nationatility = verification['nacionality'];
          }
        }

        const user = entityManager.create(User, {
          id: rehiveUser.id,
          firstName: rehiveUser.firstName.toLowerCase(),
          residence: residence,
          nationality: nationatility,
          lastName: rehiveUser.lastName.toLowerCase(),
          email: rehiveUser.email,
          username: rehiveUser.username,
          mobile: rehiveUser.mobile,
          lastSession: new Date(rehiveUser.lastSession),
          createdAt: new Date(rehiveUser.createdAt),
          updatedAt: new Date(rehiveUser.updateAt),
        });
        await entityManager.insert(User, user);

        const autoconvert = entityManager.create(Autoconvert, {
          user: user,
          coin: this.coins.find((coin) => coin.acronym == CoinEnum.GTQ),
        });
        await entityManager.insert(Autoconvert, autoconvert);

        const account = entityManager.create(Account, {
          user: user,
        });
        await entityManager.save(Account, account, { reload: true });

        const wallets: Wallet[] = this.coins.map((coin) => {
          let balance = 0;
          if (coin.acronym == CoinEnum.GTQ) {
            balance = userBalance.gtqBalance;
          }
          if (coin.acronym == CoinEnum.USD) {
            balance = userBalance.usdBalance;
          }
          if (coin.acronym == CoinEnum.SATS) {
            balance = userBalance.satsBalance;
          }
          return entityManager.create(Wallet, {
            balance: balance,
            availableBalance: balance,
            coin: coin,
            account: account,
          });
        });
        await entityManager.save(Wallet, wallets);
        const roleUser = entityManager.create(UserRole, {
          role: this.role,
          user: user,
        });
        await entityManager.insert(UserRole, roleUser);
        const fiatCoinString = preferences != undefined ? preferences.fiatCoin : 'USD';
        const cryptoCoinString = preferences != undefined ? preferences.cryptoCoin : 'SATS';
        const fiatCoinPreference = FiatCoinPreference[fiatCoinString];
        const cryptoCoinPreference = CryptoCoinPreference[cryptoCoinString];
        const preference = entityManager.create(Preference, {
          user: user,
          askPin: this.period,
          fiatCoin: fiatCoinPreference,
          cryptoCoin: cryptoCoinPreference,
        });
        const tierUser = entityManager.create(TierUser, {
          tier: this.tier,
          user: user
        })
        await entityManager.insert(TierUser, tierUser)
        await entityManager.insert(Preference, preference);
        const ibexAccount = entityManager.create(IbexAccount, {
          account: oldIbexAccount.accountId,
          name: oldIbexAccount.name,
          user: user,
          usernameId: customLNUsername ? customLNUsername.id : null
        });
        await entityManager.insert(IbexAccount, ibexAccount);
        const kycVerified = verification?.status === 'verified';
        const verificationInstance = entityManager.create(Verification, {
          user: user,
          email: rehiveUser.isEmailVerified,
          mobile: rehiveUser.isMobileVerified,
          kyc: kycVerified,
        });
        await entityManager.save(Verification, verificationInstance, {
          reload: true,
        });

        const fundingTransactionLimits = entityManager.create(
          UserTransactionLimit,
          { user: user, feature: fundingFeature },
        );
        const withdrawTransactionLimits = entityManager.create(
          UserTransactionLimit,
          { user: user, feature: withdrawFeature },
        );
        await entityManager.insert(UserTransactionLimit, [
          fundingTransactionLimits,
          withdrawTransactionLimits,
        ]);
        this.createVerification(verification, user);
        this.createRecurrentBuys(user, recurrentBuys);
        //this.createAddresses(user, ibexAccount);
      });
    } catch (error) {
      console.log('------------------')
      console.log('ERROR', rehiveUser.email)
      console.log(rehiveUser)
      console.log(userBalance)
      console.log(preferences)
      console.log(oldIbexAccount)
      console.log(recurrentBuys)
      console.log('------------------')
    }
  }

  async createRecurrentBuys(
    user: User,
    rehiveRecurrentBuys: RehiveRecurrentBuy[],
  ) {
    if (rehiveRecurrentBuys.length > 0) {
      const recurrentBuys: RecurrentBuy[] = rehiveRecurrentBuys.map((data) => {
        const period = this.periods.find(
          (period) => period.name == data.period,
        );
        const coin = this.coins.find((coin) => coin.acronym == data.currency);
        return this.recurrentBuyRepository.create({
          user: user,
          amount: data.amount,
          period: period,
          coin: coin,
          createdAt: data.created,
          time: data.time,
        });
      });
      await this.recurrentBuyRepository.insert(recurrentBuys);
    }
  }

  async createVerification(verification: any, user: User) {
    try {
      if (verification && verification.verification_id != null) {
        let status: Status
        const statusString = verification['status'].toString().toLowerCase();
        if (verification['status'] == 'pending') {
          status == Status.IN_PROCESS;
        }
        if (statusString == 'reviewneeded') {
          status = Status.REVIEW_NEEDED;
        }
        if (statusString == 'rejected') {
          status = Status.REJECTED
        }
        const kycVerification = this.kycVerificationRepository.create({
          user: user,
          attemps: verification['attempts'],
          verificationId: verification['verification_id'],
          duplicated: false,
          status: status,
        });
        await this.kycVerificationRepository.insert(kycVerification);
        const kycVerificationSteps: KycVerificationStep[] = this.kycSteps.map(
          (step) => {
            const verified = verification['steps'][step] == 'ok';
            let error = null;
            if (!verified) {
              error = verification['steps'][step];
            }
            return this.kycVerificationStep.create({
              step: step,
              verification: kycVerification,
              verified: verified,
              error: error,
            });
          },
        );
        await this.kycVerificationStep.insert(kycVerificationSteps);
      }
    } catch (error) {
      console.log(verification);
      console.log(error);
    }
  }

  async getUserDataMigration(rehiveUser: RehiveUser) {
    const user = await this.userRepository.findOneBy({
      id: rehiveUser.id
    })
    this.userNumber++;
    if (user) {
      return;
    }
    const ibexAccount = await this.getIbexAccount(rehiveUser);
    if (ibexAccount == null) {
      const userNON: NONIbexAccount = {
        email: rehiveUser.email,
        firstName: rehiveUser.firstName,
        lastName: rehiveUser.lastName,
        id: rehiveUser.id
      }
      Array.prototype.push.apply(this.usersNONIbexAccount, [userNON]);
    }
    if (ibexAccount != null) {
      const [userBalance, verification, preferences, recurrentBuys] = await Promise.all([
        this.getUserBalances(rehiveUser, ibexAccount),
        this.getVerification(rehiveUser),
        this.getPreferences(rehiveUser),
        this.getRecurrentBuys(rehiveUser)
      ])

      this.creteUserData(
        rehiveUser,
        userBalance,
        ibexAccount,
        verification,
        preferences,
        recurrentBuys,
      );
    }
  }


  async updateDocumentNumber() {
    const page = 0;
    let kycVerifications: KycVerification[];
    kycVerifications = await this.kycVerificationRepository.find({
      where: {
        documentNumber: IsNull(),
        status: Status.VERIFIED,
        verificationId: Not(Like('%manual%'))
      },
      skip: 1 * 10,
      take: 600,
    })



    //15c5aefb-29d5-4a76-8c5a-bf730c6da0df
    //2119dfb3-973e-46f1-9e9a-8a3763f08ef8
    //22f03c76-f292-47b3-9753-0dba0499a1b3
    //2d61b554-e9e9-4b33-a5d1-473a8663add6
    //310d6221-e460-4a6d-b650-3dd12ea3a530

    for (const kycVerification of kycVerifications) {
      console.log(process.env.KYC_BASE_URL)
      try {
        const metamapKycVerification = await this.kycService.getKycUser(kycVerification.verificationId)
        //console.log(metamapKycVerification)
        const documentDocumentNumber = getKycDocumentNumber(metamapKycVerification)
        await this.kycVerificationRepository.update(kycVerification.id, {
          documentNumber: documentDocumentNumber
        })
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        //console.log(error)
        console.log(kycVerification.id)
      }
    }
    // do {
    //   kycVerifications = await this.kycVerificationRepository.find({
    //     where: {
    //       documentNumber: IsNull(),
    //       status: Status.VERIFIED,
    //     },
    //     skip: page * 10,
    //     take: 10,
    //   });
    //   for (const kycVerification of kycVerifications) {
    //     console.log(kycVerification.verificationId)
    //     console.log(process.env.KYC_BASE_URL)
    //     const metamapKycVerification = await this.kycService.getKycUser(kycVerification.verificationId)
    //     console.log(metamapKycVerification)
    //     const documentDocumentNumber = getKycDocumentNumber(metamapKycVerification)
    //     await this.kycVerificationRepository.update(kycVerification.id, {
    //       documentNumber: documentDocumentNumber
    //     })
    //   }
    //   page++;
    // } while (kycVerifications.length);
  }

  async createIbexAddress() {
    const page = 0;
    let ibexAccounts: IbexAccount[];
    const emailsToExclude = [
      'kdecheverriab@gmail.com',
      'piero@osmowallet.com',
      'joaquin072500@gmail.com',
      'jose.gerardoa@gmail.com',
      'mp@singularagency.co',
      'juanrohr@icloud.com',
      'fh@singularagency.co',
      'gm@singularagency.co',
      'pierocoen3@gmail.com',
      'jcmep15@gmail.com',
      'mb@singularagency.co',
      'victor@osmowallet.com',
      'victor.echeve95@gmail.com',
      'jose@osmowallet.com'
    ];
    // const body: CreateIbexAddressesDto = {
    //   ibexAccountId: '9a8bae26-25f9-4b1e-9118-544a7c6b9b57'
    // }
    // this.googleCloudTaskService.createInternalTask(
    //   'CREATE-IBEX-ADDRESS-PROD',
    //   body,
    //   'https://api.osmowallet.com/ibex/addresses'
    // )
    // do {
    //   ibexAccounts = await this.ibexAccountRepository.createQueryBuilder("ibexAccount")
    //   .leftJoin("ibexAccount.user", "user")
    //   .leftJoinAndSelect("user.addresses", "address")
    //   .where("address.id IS NULL")
    //   .skip(page * 10)
    //   .take(10)
    //   .getMany();
    //   console.log(ibexAccounts)
    //   for (const ibexAccount of ibexAccounts) {
    //     const body: CreateIbexAddressesDto = {
    //       ibexAccountId: ibexAccount.account
    //     }
    //     this.googleCloudTaskService.createInternalTask(
    //       this.CREATE_IBEX_ADDRESS_QUEUE,
    //       body,
    //       this.CREATE_IBEX_ADDRESS_URL
    //     )
    //   }
    //   page++;
    // } while (ibexAccounts.length);
  }

  async runMigration() {
    console.log('asds')
    await this.ibexService.login()
    const [features, coins, role, periods, tier, usernames] =
      await Promise.all([
        this.featureRepository.find({
          where: { name: In([FeatureEnum.FUNDING, FeatureEnum.WITHDRAW]) },
        }),
        this.coinRepository.find({ where: { isActive: true } }),
        this.roleRepository.findOneBy({ name: 'User' }),
        this.periodRepository.find(),
        this.tierRepository.findOne({
          where: {
            name: 'Standard'
          }
        }),
        this.usernameService.getAllUsernames()
      ]);

    this.usernames = usernames
    this.tier = tier;
    this.features = features;
    this.coins = coins;
    this.role = role;
    this.periods = periods;
    this.period = periods.find((p) => p.name == '5 minutes');
    this.kycSteps = Object.values(KycStep);
    await Promise.all([
      this.getRehiveUserBalances(),
      this.getRehiveUsers()
    ])
    let usersFixed: RehiveUser[] = this.users.map((user: any) => {
      if (
        user.account != null &&
        user.id != null &&
        user.email != null &&
        user.mobile != null
      ) {
        return {
          id: user.id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          mobile: user.mobile,
          account: user.account,
          createdAt: user.created,
          updateAt: user.updated,
          lastSession: user.last_login,
          isEmailVerified: user.verification.email,
          isMobileVerified: user.verification.mobile,
          isKycVerified: user.verified,
        };
      }
    });
    usersFixed = usersFixed.filter((u) => u != undefined);
    // const emailToInclude = [
    //   'juanrohr@icloud.com',
    // ]
    const emailsToExclude = [
      'kdecheverriab@gmail.com',
      'piero@osmowallet.com',
      'joaquin072500@gmail.com',
      'jose.gerardoa@gmail.com',
      'mp@singularagency.co',
      'juanrohr@icloud.com',
      'fh@singularagency.co',
      'gm@singularagency.co',
      'pierocoen3@gmail.com',
      'jcmep15@gmail.com',
      'mb@singularagency.co',
      'victor@osmowallet.com',
      'victor.echeve95@gmail.com',
      'jose@osmowallet.com'
    ];
    usersFixed = usersFixed.filter(u => !emailsToExclude.includes(u.email));
    //usersFixed = usersFixed.filter(u => !(u.email.startsWith('mp') || u.email.startsWith('maxi') || u.email.startsWith('amilkar')));
    //usersFixed = usersFixed.filter(u => u.email == 'tenzinghang@gmail.com')
    //usersFixed = usersFixed.filter(u => emailToInclude.includes(u.email))
    this.balances = this.balances.filter(balance => balance.user != null)
    console.log(`total users: ${usersFixed.length}`)

    await new Promise((resolve) => setTimeout(resolve, 2000));
    const batchSize = 500;
    for (let i = 0; i < usersFixed.length; i += batchSize) {
      const batch = usersFixed.slice(i, i + batchSize);
      await Promise.all(batch.map((user) => this.getUserDataMigration(user)));
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    this.csvWriter.writeRecords(this.usersNONIbexAccount)
  }

  async getRehiveUsers() {
    const url = this.rehiveBaseURL + '/users/?page_size=250';
    const headers = {
      Authorization: 'Token ' + this.rehiveToken,
    };

    let data = await axios
      .get(url, { headers: headers })
      .then((response) => response.data.data);
    Array.prototype.push.apply(this.users, data.results);
    while (data.next != null) {
      this.userPage++;
      console.log(`Pasando ${this.userPage}`);
      data = await axios
        .get(data.next, { headers: headers })
        .then((response) => response.data.data)
        .catch((error) => console.log(error.response.data));
      Array.prototype.push.apply(this.users, data.results);
    }
  }

  async completeFundingTransactionLimit() {
    const users = await this.userRepository.find()
    const fundingMethods = await this.fundingMethodRepository.find()

    users.forEach(user => {
      fundingMethods.forEach(async method => {
        await this.fundingTransactionLimitRepository.insert({
          dailyAmassedAmount: 0,
          monthlyAmassedAmount: 0,
          user,
          fundingmethod: method
        }) 
      });
    });
  }
}
