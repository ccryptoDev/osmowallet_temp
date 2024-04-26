import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BankAccount } from 'src/entities/bank.account.entity';
import { Bank } from 'src/entities/bank.entity';
import { Coin } from 'src/entities/coin.entity';
import { Period } from 'src/entities/period.entity';
import { Preference } from 'src/entities/preference.entity';
import { User } from 'src/entities/user.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { In, Join, Not, Repository } from 'typeorm';
import { BankAccountDto } from './dto/banks.account.dto';
import { PreferenceDto } from './dto/preference.dto';
import { RecentContact } from 'src/entities/recent.contact.entity';
import { Autoconvert } from 'src/entities/autoconvert.entity';
import { ProfilePictureDto } from './dto/profilePicture.dto';
import { GoogleCloudStorageService } from '../../services/google-cloud-storage/google-cloud-storage.service';
import { AuthUser } from '../auth/payloads/auth.payload';
import { AccountDeletion } from 'src/entities/account.deletion.entity';
import { UpdateUsernameDto } from './dto/updateUsername.dto';
import { UsernameMsService } from '../username-ms/username-ms.service';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { EditEmailDto } from './dto/editEmail.dto';
import { WalletsService } from '../wallets/wallets.service';
import { UpdateReferralSourceDto } from './dto/updateReferralSource.dto';
import { UserReferralSource } from 'src/entities/user.referral.source.entity';
import { ReferralSource } from 'src/entities/referral.source.entity';

@Injectable()
export class MeService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(BankAccount)
    private bankAccountRepository: Repository<BankAccount>,
    @InjectRepository(Preference)
    private preferenceRepository: Repository<Preference>,
    @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
    @InjectRepository(Bank) private bankRepository: Repository<Bank>,
    @InjectRepository(Coin) private coinRepository: Repository<Coin>,
    @InjectRepository(Period) private periodRepository: Repository<Period>,
    @InjectRepository(RecentContact)
    private recentContactRepository: Repository<RecentContact>,
    @InjectRepository(Autoconvert)
    private autoconvertRepository: Repository<Autoconvert>,
    @InjectRepository(AccountDeletion)
    private accountDeletionRepository: Repository<AccountDeletion>,
    @InjectRepository(IbexAccount) private ibexAccount: Repository<IbexAccount>,
    private usernameService: UsernameMsService,
    private googleCloudStorageService: GoogleCloudStorageService,
    private walletService: WalletsService,
    @InjectRepository(UserReferralSource) private userReferralSourceRepository: Repository<UserReferralSource>,
    @InjectRepository(ReferralSource) private referralSourceRepository: Repository<ReferralSource>,
  ) {}

  async updatePhone(authUser: AuthUser, data: any) {
    const user = await this.userRepository.findOneBy({
      mobile: data.mobile
    })
    if(user) throw new BadRequestException('Mobile already exists')
    await this.userRepository.update(authUser.sub, {
      mobile: data.mobile
    })
  }

  async updateEmail(authUser: AuthUser, data: EditEmailDto) {
    try {
      const user = await this.userRepository.findOneBy({ email: data.email });
      if(user) throw new BadRequestException('Este email ya existe');
        
      await this.userRepository.update(authUser.sub, {
        email: data.email,
      });
      
    } catch (error) {
      throw error;
    }
  }

  async updateUsername(authUser: AuthUser, data: UpdateUsernameDto) {
    try {
      const user = await this.userRepository.findOneBy({ id: authUser.sub });
      if (user.usernameChanges == 2)
        throw new BadRequestException('Username has been changed twice');
      const ibexAccount = await this.ibexAccount.findOne({
        where: { user: { id: authUser.sub } },
      });
      await this.usernameService.updateUsername(ibexAccount, data.username);

      const counts = user.usernameChanges + 1;
      await this.userRepository.update(authUser.sub, {
        username: data.username,
        usernameChanges: counts,
      });
    } catch (error) {
      throw error;
    }
  }

  async deleteOsmoAccount(authUser: AuthUser) {

    const existsRequest = await this.accountDeletionRepository.findOne({
      where: {
        user: {id: authUser.sub},
      }
    })
    if(existsRequest) throw new BadRequestException('Ya existe una solicitud en curso')

    const accountDeletion = this.accountDeletionRepository.create({
      user: { id: authUser.sub },
    });
    await this.accountDeletionRepository.save(accountDeletion);
  }

  async getRecentContacts(authUser: AuthUser) {
    try {
      const recentContactRecords = await this.recentContactRepository.find({
        relations: { contact: true },
        where: { user: { id: authUser.sub } },
      });
      const usersIds = recentContactRecords.map(
        (recentContactRecord) => recentContactRecord.contact.id,
      );
      const users = await this.userRepository.find({
        relations: {
          addresses: true,
          verifications: true,
        },
        where: {
          id: In([usersIds]),
        },
      });
      return users;
    } catch (error) {
      throw error;
    }
  }

  async getProfile(authUser: AuthUser) {
    const profile = await this.userRepository.findOne({
      relations: {
        verifications: true,
        addresses: true,
      },
      where: { id: authUser.sub },
    });
    return profile;
  }

  async updateProfilePicture(
    authUser: AuthUser,
    file: Express.Multer.File,
    data: ProfilePictureDto,
  ) {
    try {
      const user = await this.userRepository.findOneBy({ id: authUser.sub });
      const userRecord = await this.getProfile(authUser);
      const expiry = Date.now() + 3600 * 1000 * 7;
      const path = `Users/${user.id}/profile/picture-${Date.now()}-${file.originalname}`;
      await this.googleCloudStorageService.saveFile(file, path);
      userRecord.profilePicturePath = path;
      userRecord.profilePicture = await this.googleCloudStorageService.getSignedUrl(path, expiry);
      userRecord.profileHash = data.hash;
      userRecord.profilePictureExpiry = new Date(expiry);
      await this.userRepository.save(userRecord, { reload: true });
      return userRecord;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error interno al actualizar foto de perfil',
      );
    }
  }

  async createBankAccount(authUser: AuthUser, data: BankAccountDto) {
    try {
      const bank = await this.bankRepository.findOneBy({ id: data.bankId });
      if (bank == null) {
        throw new BadRequestException(
          'No se encontro ninguna banco con este id',
        );
      }
      const user = await this.userRepository.findOneBy({ id: authUser.sub });
      const coin = await this.coinRepository.findOneBy({ id: data.coinId });
      if (!coin) throw new BadRequestException('Invalid coin');
      if (!['USD', 'GTQ'].includes(coin.acronym))
        throw new BadRequestException('Invalid coin');

      const existsAccount = await this.bankAccountRepository.find({
        relations: { user: true },
        where: {
          user: { id: authUser.sub },
          accountNumber: data.accountNumber,
          bankAccountType: data.accountType,
          coin: { id: coin.id },
        },
      });
      if (existsAccount.length > 0)
        throw new BadRequestException(
          'Ya existe una cuenta banco creada con estos mismos datos',
        );
      const bankAccount = this.bankAccountRepository.create({
        bank: bank,
        bankAccountType: data.accountType,
        accountNumber: data.accountNumber,
        user: user,
        coin: coin,
        accountHolder: data.accountName,
      });
      await this.bankAccountRepository.insert(bankAccount);
      return bankAccount;
    } catch (error) {
      throw error;
    }
  }

  async getBankAccounts(authUser: AuthUser) {
    try {
      const bankAccounts = await this.bankAccountRepository.find({
        relations: { bank: true, coin: true },
        where: {
          user: { id: authUser.sub },
        },
      });
      return bankAccounts;
    } catch (error) {
      throw error;
    }
  }

  async updateBankAccount(
    authUser: AuthUser,
    data: BankAccountDto,
    bankId: string,
  ) {
    try {
      const bank = await this.bankRepository.findOneBy({ id: data.bankId });
      if (bank == null) throw new BadRequestException('Invalid bank',);

      const bankAccount = await this.bankAccountRepository.findOneBy({
        id: bankId,
      });
      if (bankAccount == null)
        throw new BadRequestException(
          'Invalid bankAccount',
        );

      const coin = await this.coinRepository.findOneBy({ id: data.coinId });

      const existsAccount = await this.bankAccountRepository.find({
        relations: { user: true },
        where: {
          id: Not(bankId),
          bank: { id: bank.id },
          user: { id: authUser.sub },
          accountNumber: data.accountNumber,
          bankAccountType: data.accountType,
          coin: { id: coin.id },
        },
      });
      if (existsAccount.length > 0)
        throw new BadRequestException(
          'Ya existe una cuenta banco creada con estos mismos datos',
        );
      bankAccount.accountNumber = data.accountNumber;
      bankAccount.accountHolder = data.accountName;
      bankAccount.bankAccountType = data.accountType;
      bankAccount.bank = bank;
      bankAccount.coin = coin;
      await this.bankAccountRepository.save(bankAccount, { reload: true });
      return bankAccount;
    } catch (error) {
      throw error;
    }
  }

  async deleteBankAccount(authUser: AuthUser, bankId: string) {
    try {
      const bankAccount = await this.bankAccountRepository.findOne({
        relations: { user: true },
        where: {
          user: { id: authUser.sub },
          id: bankId,
        },
      });
      if (!bankAccount)
        throw new NotFoundException('Este banco no exite en tu cuenta');
      await this.bankAccountRepository.remove(bankAccount);
    } catch (error) {
      throw error;
    }
  }

  async getWallets(authUser: AuthUser) {
    const wallets = await this.walletService.getWalletsByUser(authUser.sub)
    return wallets;
  }

  async getPreferences(authUser: AuthUser) {
    try {
      const preferences = this.preferenceRepository.findOne({
        relations: { askPin: true },
        where: { user: { id: authUser.sub } },
      });
      return preferences;
    } catch (error) {
      throw error;
    }
  }

  async updatePreference(authUser: AuthUser, data: PreferenceDto) {
    const preferenceRecord = await this.preferenceRepository.findOneBy({
      user: { id: authUser.sub },
    });
    const askPinRecord = await this.periodRepository.findOneBy({
      id: data.askPin,
    });
    if (!askPinRecord) throw new BadRequestException('Periodo no válido');
    preferenceRecord.promotionalNotification = data.promotionalNotification
    preferenceRecord.dynamicOnchainAddress = data.dynamicOnchainAddress;
    preferenceRecord.securityNotification = data.securityNotification;
    preferenceRecord.askPin = askPinRecord;
    preferenceRecord.fiatCoin = data.fiatCoin;
    preferenceRecord.cryptoCoin = data.cryptoCoin;
    await this.preferenceRepository.save(preferenceRecord, { reload: true });
    return preferenceRecord;
  }

  async updateReferralSource(authUser: AuthUser, data: UpdateReferralSourceDto) {
    try {
      const user = await this.userRepository.findOneBy({ id: authUser.sub });
      const userReferralSource = await this.userReferralSourceRepository.findOneBy({ user: user });

      const referralSource = await this.referralSourceRepository.findOneBy({ id: data.referralSourceId });

      if (userReferralSource) { // update

        await this.userReferralSourceRepository.update(userReferralSource.id, {
          user,
          referralSource
        });

      } else { // create new

        const userReferralSourceNew = this.userReferralSourceRepository.create({
          user,
          referralSource
        });
        await this.userReferralSourceRepository.insert(userReferralSourceNew);

      }
      
    } catch (error) {
      throw error;
    }
  }
}
