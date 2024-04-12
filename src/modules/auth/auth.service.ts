import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThan, Repository } from 'typeorm';
import { AuthToken } from 'src/entities/auth.token.entity';
import { SignUpDto } from './dto/signup.dto';
import { Account } from 'src/entities/account.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { Preference } from 'src/entities/preference.entity';
import { Coin } from 'src/entities/coin.entity';
import { Role } from 'src/entities/role.entity';
import { UserRole } from 'src/entities/roleUser.entity';
import { Period } from 'src/entities/period.entity';
import { Verification } from 'src/entities/verification.entity';
import { SessionDto } from './dto/session.dto';
import { PushToken } from 'src/entities/push.token.entity';
import { Session } from 'src/entities/session.entity';
import { App } from 'src/entities/app.entity';
import { AuthDto } from './dto/auth.dto';
import { SigninSessionTemplate } from 'src/modules/send-grid/templates/auth/signinSession.template';
import { Otp } from 'src/entities/otp.entity';
import EncrypterHelper from 'src/common/helpers/encrypter.helper';
import { IbexService } from '../ibex/ibex.service';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { Address } from 'src/entities/address.entity';
import { GoogleCloudStorageService } from '../../services/google-cloud-storage/google-cloud-storage.service';
import { SendGridService } from '../send-grid/send-grid.service';
import { AuthUser } from './payloads/auth.payload';
import { GrantType } from './enums/granTypes.enum';
import { PartnerToken } from 'src/entities/partnerTokens.entity';
import { Autoconvert } from 'src/entities/autoconvert.entity';
import { CoinEnum } from '../me/enums/coin.enum';
import { ReferralService } from '../referral/referral.service';
import { SmsService } from '../../services/sms/sms.service';
import * as otpGenerator from 'otp-generator';
import * as crypto from 'crypto';
import { VerifyEmailValid } from './dto/verifyEmailValid.dto';
import { EmailableService } from '../../services/emailable/emailable.service';
import { UserTransactionLimit } from 'src/entities/userTransactionLimit.entity';
import { Feature } from 'src/entities/feature.entity';
import { isEmail, isUUID } from 'class-validator';
import { OTP } from 'src/common/enums/otp.enum';
import { AuthOTPDto } from './dto/authOtp.dto';
import { OTPSigninTemplate } from '../send-grid/templates/auth/otp.template';
import { PinDto } from './dto/pin.dto';
import { UsernameMsService } from '../username-ms/username-ms.service';
import { SignInDto } from './dto/signin.dto';
import { Tier } from 'src/entities/tier.entity';
import { TierUser } from 'src/entities/tierUser.entity';
import { OtpDto } from './dto/otp.dto';
import { InputDto } from './dto/input.dto';
import { SignupOtpDto } from './dto/signupOtp.dto';
import { InjectModel } from '@nestjs/mongoose';
import { UsaUser } from 'src/schemas/usaUser.schema';
import { Model } from 'mongoose';
import { CreateUsaUserDto } from './dto/usaUser.dto';
import { AlgoliaService } from 'src/services/algolia/algolia.service';
import { FeatureEnum } from 'src/common/enums/feature.enum';
import { CoinsService } from '../coins/coins.service';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { CreateIbexAddressesDto } from '../ibex/dtos/create-addresses.dto';
import { UsersService } from '../users/users.service';
import { KycService } from '../kyc/kyc.service';
import { FundingTransactionLimit } from 'src/entities/fundingTransactionLimits.entity';
import { FundingMethod } from 'src/entities/fundingMethod.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(AuthToken) private authTokenRepository: Repository<AuthToken>,
    @InjectRepository(Account) private accountRepository: Repository<Account>,
    @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
    @InjectRepository(Preference) private preferenceRepository: Repository<Preference>,
    @InjectRepository(Coin) private coinRepository: Repository<Coin>,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    @InjectRepository(UserRole) private roleUserRepository: Repository<UserRole>,
    @InjectRepository(Period) private periodRepository: Repository<Period>,
    @InjectRepository(Verification) private verificationRepository: Repository<Verification>,
    @InjectRepository(PushToken) private pushTokenRepository: Repository<PushToken>,
    @InjectRepository(Session) private sessionRepository: Repository<Session>,
    @InjectRepository(App) private appRepository: Repository<App>,
    @InjectRepository(Otp) private otpRepository: Repository<Otp>,
    @InjectRepository(IbexAccount) private ibexAccountRepository: Repository<IbexAccount>,
    @InjectRepository(Address) private addressRepository: Repository<Address>,
    @InjectRepository(PartnerToken) private partnerTokenRepository: Repository<PartnerToken>,
    @InjectRepository(Feature) private featureRepository: Repository<Feature>,
    @InjectRepository(Tier) private tierRepository: Repository<Tier>,
    @InjectRepository(TierUser) private tierUserRepository: Repository<TierUser>,
    @InjectRepository(FundingMethod) private fundingMethodRepository: Repository<FundingMethod>,
    @InjectModel(UsaUser.name) private usaUserModel: Model<UsaUser>,
    private ibexService: IbexService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private sengridService: SendGridService,
    private encrypterHelper: EncrypterHelper,
    private googleCloudStorageService: GoogleCloudStorageService,
    private smsService: SmsService,
    private referralService: ReferralService,
    private emailableService: EmailableService,
    private usernameMService: UsernameMsService,
    private algoliaService: AlgoliaService,
    private coinService: CoinsService,
    private googleCloudTaskService: GoogleCloudTasksService,
    private userService: UsersService,
    private kycService: KycService
  ) {
    //this.saveAllUsers()
    //this.createAdminUsers()
  }

  private CREATE_ACCOUNT_IBEX_QUEUE = `CREATE-IBEX-ACCOUNT-${process.env.ENV}`
  private CREATE_IBEX_ACCOUNT_URL = `https://${process.env.DOMAIN}/ibex/accounts`

  private CREATE_IBEX_ADDRESS_QUEUE = `CREATE-IBEX-ADDRESS-${process.env.ENV}`
  private CREATE_IBEX_ADDRESS_URL = `https://${process.env.DOMAIN}/ibex/addresses`


  async saveAllUsers(){
    let page = 0;
    let users;
    do {
      users = await this.userRepository.find({
        relations: {verifications: true, addresses: true},
        skip: page * 100,
        take: 100,
      });
      await Promise.all(users.map(user => this.algoliaService.saveUser(user)));
      page++;
    } while (users.length === 100);
  }

  async createUsaUser(data: CreateUsaUserDto) {
    const app = await this.appRepository.findOne({
      where: {
        clientId: data.clientId,
        clientSecret: data.clientSecret
      }
    })
    if(!app) throw new UnauthorizedException()
    const usaUser = await this.usaUserModel.findOne({input: data.input, country: data.country})
    if(usaUser) return;
    await this.usaUserModel.create({input: data.input,country: data.country})
  }

  async checkHasPin(authUser: AuthUser) {
    const user = await this.userRepository.findOneBy({ id: authUser.sub });
    if(!user) throw new BadRequestException('Invalid user')
    return {
      hasPin: user.pin != null
    }
  }

  async verifyPin(authUser: AuthUser, data: PinDto) {
    const user = await this.userRepository.findOneBy({ id: authUser.sub });
    if(user.email == 'mp@singularagency.co'){
      console.log('PIN',data.pin)
    }
    const isPinValid = await this.verifyPassword(user.pin, data.pin);
    if (!isPinValid) throw new ForbiddenException('Invalid pin');
  }

  async createPin(authUser: AuthUser, data: PinDto) {
    try {
      const hashedPin = await this.hashPassword(data.pin);
      await this.userRepository.update(authUser.sub, {
        pin: hashedPin,
      });
    } catch (error) {
      throw error;
    }
  }

  async verifyEmailValid(query: VerifyEmailValid) {
    const response = await this.emailableService.verify(query.email);
    return {
      isValid: response.score > 60,
    };
  }

  async updateLastSession(authUser: AuthUser) {
    try {
      const date = new Date();
      await this.userRepository.update(authUser.sub, { lastSession: date });
    } catch (error) {
      throw new BadRequestException('Error updating session');
    }
  }

  async sendMobileVerification(authUser: AuthUser) {
    try {
      const verificationRecord = await this.verificationRepository.findOne({
        where: {
          user: { id: authUser.sub },
          mobile: true,
        },
      });
      if (verificationRecord) throw new BadRequestException('Mobile verified');
      const user = await this.userRepository.findOneBy({ id: authUser.sub });
      if(!user) throw new BadRequestException('Invalid user')
      if(user.mobile == null) throw new BadRequestException('User has not mobile yet')
      const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
        digits: true,
        lowerCaseAlphabets: false,
      });
      let otpRecord = await this.otpRepository.findOne({
        where: {
          user: { id: authUser.sub },
          type: OTP.VERIFICATION,
        },
      });
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 15);
      if (otpRecord) {
        await this.otpRepository.update(otpRecord.id, {
          otp: otp,
          expiry: expiry,
        });
      } else {
        otpRecord = this.otpRepository.create({
          user: user,
          otp: otp,
          expiry: expiry,
          type: OTP.VERIFICATION,
        });
        await this.otpRepository.insert(otpRecord);
      }
      this.smsService.sendSMS({
        message: `Este es tu código: ${otp} de OsmoWallet`,
        phoneNumber: user.mobile,
      });
    } catch (error) {
      throw error;
    }
  }

  async verifyMobile(authUser: AuthUser, otp: number) {
    try {
      const expiry = new Date();
      const otpRecord = await this.otpRepository.findOne({
        where: {
          user: { id: authUser.sub },
          otp: otp,
          type: OTP.VERIFICATION,
          expiry: MoreThan(expiry),
        },
      });
      if (otpRecord) {
        const verificationRecord = await this.verificationRepository.findOne({
          where: {
            user: { id: authUser.sub },
          },
        });
        await this.verificationRepository.update(verificationRecord, {
          mobile: true,
        });
        await this.otpRepository.remove(otpRecord);
        this.referralService.referral(authUser)
        await this.userService.indexUser(authUser.sub)
      } else {
        throw new BadRequestException('Código no válido o expirado');
      }
    } catch (error) {
      throw error;
    }
  }

  async verifyInputVerification(data: SignupOtpDto){
    const app = await this.appRepository.findOneBy({
      clientId: data.clientId,
      clientSecret: data.clientSecret,
    });

    if (!app) throw new UnauthorizedException();
    if (!app.name.toLowerCase().includes('osmo')) throw new UnauthorizedException();
    const expiry = new Date();
    const otpRecord = await this.otpRepository.findOne({
      where: {
        input: data.input,
        otp: data.otp,
        type: OTP.VERIFICATION,
        expiry: MoreThan(expiry),
      },
    });
    if(!otpRecord) throw new BadRequestException('Invalid OTP or expired')
    await this.otpRepository.remove(otpRecord);
  }

  async sendInputVerification(data: InputDto) {      
    const app = await this.appRepository.findOneBy({
      clientId: data.clientId,
      clientSecret: data.clientSecret,
    });

    if (!app) throw new UnauthorizedException();
    if (!app.name.toLowerCase().includes('osmo')) throw new UnauthorizedException();
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      digits: true,
      lowerCaseAlphabets: false,
    });
    let otpRecord = await this.otpRepository.findOne({
      where: {
        input: data.input,
        type: OTP.VERIFICATION,
      },
    });
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 15);
    if (otpRecord) {
      await this.otpRepository.update(otpRecord.id, {
        otp: otp,
        expiry: expiry,
      });
    } else {
      otpRecord = this.otpRepository.create({
        input: data.input,
        otp: otp,
        expiry: expiry,
        type: OTP.VERIFICATION,
      });
      await this.otpRepository.insert(otpRecord);
    }
    if(isEmail(data.input)){
      const template = new OTPSigninTemplate(
        [{ email: data.input, name: 'OsmoUser' }],
        otp,
      );
      this.sengridService.sendMail(template);
    }else{
      this.smsService.sendSMS({
        message: `Este es tu código: ${otp} de OsmoWallet`,
        phoneNumber: data.input,
      });
    }
  }

  async sendEmailVerification(authUser: AuthUser, otpType: OTP = OTP.VERIFICATION) {
    try {
      const user = await this.userRepository.findOneBy({ id: authUser.sub });
      if(!user) throw new BadRequestException('Invalid user')
      if(user.email == null) throw new BadRequestException('This user has not email yet')
      const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
        digits: true,
        lowerCaseAlphabets: false,
      });
      let otpRecord = await this.otpRepository.findOne({
        where: {
          user: { id: user.id },
          type: otpType,
        },
      });
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 15);
      if (otpRecord) {
        await this.otpRepository.update(otpRecord.id, {
          otp: otp,
          expiry: expiry,
        });
      } else {
        otpRecord = this.otpRepository.create({
          user: user,
          otp: otp,
          expiry: expiry,
          type: otpType,
        });
        await this.otpRepository.insert(otpRecord);
      }
      const template = new OTPSigninTemplate(
        [{ email: user.email, name: user.username }],
        otp,
      );
      this.sengridService.sendMail(template);
    } catch (error) {
      throw error;
    }
  }

  async verifyEmail(authUser: AuthUser,data: OtpDto) {
    const expiry = new Date();
      const otpRecord = await this.otpRepository.findOne({
        where: {
          user: { id: authUser.sub },
          otp: data.otp,
          type: OTP.VERIFICATION,
          expiry: MoreThan(expiry),
        },
      });
      if (otpRecord) {
        const verificationRecord = await this.verificationRepository.findOne({
          where: {
            user: { id: authUser.sub },
          },
        });
        await this.verificationRepository.update(verificationRecord, {
          email: true,
        });
        await this.otpRepository.remove(otpRecord);
      } else {
        throw new BadRequestException('Código no válido o expirado');
      }
    const verificationRecord = await this.verificationRepository.findOneOrFail({
      where: { user: { id: authUser.sub } },
    });
    await this.verificationRepository.update(verificationRecord, {
      email: true,
    });
    await this.userService.indexUser(authUser.sub)
  }

  async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');
    return [salt, hash].join('.');
  }

  async verifyPassword(
    storedPassword: string,
    providedPassword: string,
  ): Promise<boolean> {
    const [salt, storedHash] = storedPassword.split('.');
    const hash = crypto
      .pbkdf2Sync(providedPassword, salt, 1000, 64, 'sha512')
      .toString('hex');
    return hash === storedHash;
  }

  async signUp(signUpDto: SignUpDto): Promise<any> {
    const app = await this.appRepository.findOneBy({
      clientId: signUpDto.clientId,
      clientSecret: signUpDto.clientSecret,
    });
    if (!app) throw new UnauthorizedException();
    if (!app.name.toLowerCase().includes('osmo')) throw new UnauthorizedException();
    if (signUpDto.mobile != undefined) {
      const mobileExists = await this.userRepository.findOneBy({
        mobile: signUpDto.mobile,
      });
      if (mobileExists) {
        throw new BadRequestException(
          'Ya existe un usuario con este número de teléfono',
        );
      }
    }
    if (signUpDto.email != undefined) {
      const emailExists = await this.userRepository.findOneBy({
        email: signUpDto.email,
      });
      if (emailExists) {
        throw new BadRequestException('Ya existe un usuario con este email');
      }
    }
    const userNameExists = await this.userRepository.findOneBy({
      username: signUpDto.username,
    });
    if (userNameExists) {
      throw new BadRequestException('Ya existe un usuario con este username');
    }

    const [features, role, period, tier, coins, fundingMethods] = await Promise.all([
      this.featureRepository.find({
        where: { name: In([FeatureEnum.FUNDING, FeatureEnum.WITHDRAW]) },
      }),
      this.roleRepository.findOneBy({ name: 'User' }),
      this.periodRepository.findOneBy({ name: '5 minutes' }),
      this.tierRepository.findOneBy({name: 'Standard'}),
      this.coinService.getAll(),
      this.fundingMethodRepository.find()
    ]);

    //Create user
    const withdrawFeature = features.find((feature) => feature.name == FeatureEnum.WITHDRAW);
    let newUser: User
    await this.userRepository.manager.transaction(async transactionalEntityManager => {
      newUser = transactionalEntityManager.create(User, signUpDto);
      await transactionalEntityManager.insert(User, newUser);

      const account = transactionalEntityManager.create(Account, {
        user: newUser,
      });
      await transactionalEntityManager.insert(Account, account);

      const wallets: Wallet[] = coins.map((coin) => transactionalEntityManager.create(Wallet, { account: account, coin }));
      await transactionalEntityManager.insert(Wallet, wallets);
      const tierUser = transactionalEntityManager.create(TierUser,{
        tier: tier,
        user: newUser
      })
      await transactionalEntityManager.insert(TierUser,tierUser)
      //Create roles
      const roleUser = transactionalEntityManager.create(UserRole, {
        role: role,
        user: newUser,
      });
      await transactionalEntityManager.insert(UserRole, roleUser);
      // Create preference

      const preference = transactionalEntityManager.create(Preference, {
        user: newUser,
        askPin: period,
      });
      await transactionalEntityManager.insert(Preference, preference);
      // Verification
      const verificationInstance = transactionalEntityManager.create(Verification, {
        user: newUser,
        email: signUpDto.email != undefined,
        mobile: signUpDto.mobile != undefined
      });
      await transactionalEntityManager.insert(Verification, verificationInstance);

      //Autoconvert
      const autoconvert = transactionalEntityManager.create(Autoconvert, {
        user: newUser,
        coin: coins.find((coin) => coin.acronym == CoinEnum.USD),
      });
      await transactionalEntityManager.insert(Autoconvert, autoconvert);

      const withdrawTransactionLimits = transactionalEntityManager.create(
        UserTransactionLimit,
        { user: newUser, feature: withdrawFeature },
      );
      await transactionalEntityManager.insert(UserTransactionLimit, [
        withdrawTransactionLimits,
      ]);

      const fundingTransactionLimits = fundingMethods.map((method) => {
        return {
          user: newUser,
          fundingMethod: method,
        };
      })
      await transactionalEntityManager.insert(FundingTransactionLimit, fundingTransactionLimits);
    });
    this.userService.updateResidence(newUser.id,{residence: newUser.residence})
    this.referralService.referral({sub: newUser.id});
    this.createIbexAccount(newUser)
    const tokens = await this.getTokens(newUser.id, newUser.email);
    this.storeTokensForUser(newUser, tokens);
    this.kycService.createKycPartnerStatus(newUser.id)
    return tokens;

  }

  private async createIbexAccount(user: User) {
    this.googleCloudTaskService.createInternalTask(
      this.CREATE_ACCOUNT_IBEX_QUEUE,
      {
        userId: user.id
      },
      this.CREATE_IBEX_ACCOUNT_URL
    )

  }


  async signIn(data: SignInDto) {
    if (data.grantType == GrantType.Password) {
      return await this.signInAsOsmo(data);
    }
    throw new UnauthorizedException();
  }

  private async signInAsOsmo(data: SignInDto) {
    const app = await this.appRepository.findOneBy({
      clientId: data.clientId,
      clientSecret: data.clientSecret,
    });

    if (!app) throw new UnauthorizedException();
    if (!app.name.toLowerCase().includes('osmo')) throw new UnauthorizedException();
    const user = await this.userRepository.findOne({
      where: [
        {
          email: data.input.toLowerCase(),
        },
        {
          mobile: data.input,
        },
      ],
    });
    if (user) {
      const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
        digits: true,
        lowerCaseAlphabets: false,
      });
      // if(user.email == 'demo@gmail.com'){
      //   otpCode = otp
      // }
      let otpRecord = await this.otpRepository.findOne({
        where: {
          user: { id: user.id },
          type: OTP.AUTH,
        },
      });
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 15);
      if (otpRecord) {
        await this.otpRepository.update(otpRecord.id, {
          otp: otp,
          expiry: expiry,
        });
      } else {
        otpRecord = this.otpRepository.create({
          user: user,
          otp: otp,
          expiry: expiry,
          type: OTP.AUTH,
        });
        await this.otpRepository.insert(otpRecord);
      }
      if (isEmail(data.input)) {
        const template = new OTPSigninTemplate(
          [{ email: user.email, name: user.firstName ?? 'OsmoUser' }],
          otp,
        );
        this.sengridService.sendMail(template);
      } else {
        this.smsService.sendSMS({
          message: `Este es tu código para tu autenticación en OsmoWallet: ${otp}`,
          phoneNumber: user.mobile,
        });
      }
    }
  }

  async verifyAuthOTP(data: AuthOTPDto) {

    try {
      const app = await this.appRepository.findOneBy({
        clientId: data.clientId,
        clientSecret: data.clientSecret,
      });

      if (!app) throw new UnauthorizedException('Invalid app 1');
      if (!app.name.toLowerCase().includes('osmo')) throw new UnauthorizedException('Invalid app 2');
      const user = await this.userRepository.findOne({
        where: [
          {
            email: data.input,
          },
          {
            mobile: data.input,
          },
        ],
      });
      if (!user) throw new UnauthorizedException('Invalid user');
      // if(data.input == 'demo@gmail.com' && data.otp == 453782){
      //   const tokens = await this.getTokens(user.id, user.email);
      //   this.storeTokensForUser(user, tokens);
      //   return tokens;
      // }
      const otpRecord = await this.otpRepository.findOne({
        where: {
          user: { id: user.id },
          type: OTP.AUTH,
          otp: data.otp,
          expiry: MoreThan(new Date()),
        },
      });
      if (!otpRecord) throw new BadRequestException('Código no válido o expirado');
      await this.otpRepository.remove(otpRecord);
      const tokens = await this.getTokens(user.id, user.email);
      this.storeTokensForUser(user, tokens);
      const ibexAccount = await this.ibexAccountRepository.findOne({
        relations: {
            user: true
        },
        where: {user: {id: user.id}}
    })
      if(ibexAccount){
        const body: CreateIbexAddressesDto = {
          ibexAccountId: ibexAccount.account
        }
        this.googleCloudTaskService.createInternalTask(
          this.CREATE_IBEX_ADDRESS_QUEUE,
          body,
          this.CREATE_IBEX_ADDRESS_URL
        )
      }
      return tokens;
    } catch (error) {
      throw error;
    }
  }


  async logout(authUser: AuthUser, refreshToken: string) {
    try {
      const encryptedRefreshToken =
        await this.encrypterHelper.encrypt(refreshToken);
      const tokenRecord = await this.authTokenRepository.findOne({
        relations: { user: true },
        where: { refreshToken: encryptedRefreshToken },
      });

      if (!tokenRecord) throw new NotFoundException('Token no válido');

      await this.authTokenRepository.remove(tokenRecord);
      return;
    } catch (error) {
      throw error;
    }
  }

  async logoutAll(authUser: AuthUser) {
    const tokensRecord = await this.authTokenRepository.find({
      relations: { user: true },
      where: { user: { id: authUser.sub } },
    });
    await this.authTokenRepository.remove(tokensRecord);
  }

  async storeSession(
    authUser: AuthUser,
    data: SessionDto,
    refreshToken: string,
  ) {
    const user = await this.userRepository.findOneBy({ id: authUser.sub });
    const encryptedrefreshToken = await this.encrypterHelper.encrypt(refreshToken);
    const tokenRecord = await this.authTokenRepository.findOne({
      relations: { user: true },
      where: { refreshToken: encryptedrefreshToken },
    });
    const checkIfExists = await this.pushTokenRepository.findOne({
      where: { authToken: { id: tokenRecord.id } },
    });
    if (checkIfExists) return;
    const authTokenRecord = await this.authTokenRepository.findOneBy({
      id: tokenRecord.id,
    });
    if(data.token != null){
      const pushTokenRecord = this.pushTokenRepository.create({
        token: data.token,
        user: user,
        authToken: authTokenRecord,
      });
      await this.pushTokenRepository.insert(pushTokenRecord);
    }
   
    const sessionRecord = this.sessionRepository.create({
      user: user,
      authToken: authTokenRecord,
      device: data.device,
      ip: data.ip,
      location: data.location,
      platform: data.platform,
    });

    await this.sessionRepository.insert(sessionRecord);
    if(user.email != null){
      const siginSessionTemplate = new SigninSessionTemplate(
        [{ email: user.email, name: user.username }],
        data.ip,
        data.device,
        data.location,
      );
      this.sengridService.sendMail(siginSessionTemplate);
    }
  }

  async refreshTokens(authUser: AuthUser, refreshToken: string, data: AuthDto) {
    if (data.grantType == GrantType.RefreshToken) {
      if (isUUID(authUser.sub)) {
        const app = await this.appRepository.findOneBy({
          clientId: data.clientId,
          clientSecret: data.clientSecret,
        });
        if (!app) throw new UnauthorizedException();
        if (!app.name.toLowerCase().includes('osmo'))
          throw new UnauthorizedException();
    
        const user = await this.userRepository.findOneBy({ id: authUser.sub });
        const encryptedCurrentRefreshToken = await this.encrypterHelper.encrypt(refreshToken);
        const tokenRecord = await this.authTokenRepository.findOne({
          relations: { user: true },
          where: {
            user: { id: authUser.sub },
            refreshToken: encryptedCurrentRefreshToken,
          },
        });
    
        if (!tokenRecord) throw new UnauthorizedException();
    
        const tokens = await this.getTokens(user.id, user.email);
        this.updateTokens(tokenRecord, tokens);
        return tokens;
      }
    }
    throw new UnauthorizedException();
  }


  async updateTokens(tokenRecord: AuthToken, tokens: any) {
    const encryptedRefreshToken = await this.encrypterHelper.encrypt(
      tokens.refreshToken,
    );
    await this.authTokenRepository.update(tokenRecord.id, {
      refreshToken: encryptedRefreshToken,
    });
  }

  async storeTokensForUser(user: User, tokens: any) {
    const encryptedRefreshToken = await this.encrypterHelper.encrypt(
      tokens.refreshToken,
    );
    await this.authTokenRepository.insert({
      user: user,
      refreshToken: encryptedRefreshToken,
    });
  }

  private async getTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email: email,
        },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: '1h',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email: email,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  
}
