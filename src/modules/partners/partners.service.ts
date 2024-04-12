import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { In, Repository } from 'typeorm';
import { Bank } from 'src/entities/bank.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { IbexService } from '../ibex/ibex.service';
import { CoinsService } from '../coins/coins.service';
import { CoinEnum } from '../me/enums/coin.enum';
import { PartnerConfig } from 'src/entities/strikeConfig.entity';
import { LightningInvoiceDto } from '../webhooks/dtos/receiveInvoice.dto';
import { SendGridService } from '../send-grid/send-grid.service';
import { SmsService } from '../../services/sms/sms.service';
import { GetUserbyPhoneDto } from './dtos/getUser.dto';
import { InvoiceReference } from './interfaces/strikeInvoiceReferece.interface';
import { PartnerStatus } from './enums/partnerEvent.enum';
import { PartnerFlowContext, PartnerFlowStrategy } from './flows/partner.flow';
import { OsmoWalletUserFlow } from './flows/osmoWalletUser.flow';
import { OsmoWalletUserBank } from './flows/osmoWalletUserBank.flow';
import { NoOsmoUserWallet } from './flows/noOsmoUserWallet.flow';
import { ReceiveQueryDto } from './dtos/query.dto';
import { AuthUser } from '../auth/payloads/auth.payload';
import { App } from 'src/entities/app.entity';
import { PartnerGenerateInvoiceDto } from './dtos/generateInvoice.dto';
import * as crypto from 'crypto';
import { AuthDto } from '../auth/dto/auth.dto';
import { PartnerToken } from 'src/entities/partnerTokens.entity';
import EncrypterHelper from 'src/common/helpers/encrypter.helper';
import { JwtService } from '@nestjs/jwt';
import Decimal from 'decimal.js';
import { PartnerFlow } from './enums/partnerFlow.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PartnerInvoice } from 'src/schemas/partnerInvoice.schema';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { ExternalTask } from 'src/services/google-cloud-tasks/interfaces/externalTask.interface';

@Injectable()
export class PartnersService {
    private QUEUE_NOTIFIER = `PARTNER-NOTIFIER-${process.env.ENV}`
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Bank) private bankRepository: Repository<Bank>,
        @InjectRepository(IbexAccount) private ibexAccountRepository: Repository<IbexAccount>,
        @InjectRepository(PartnerConfig) private partnerConfigRepository: Repository<PartnerConfig>,
        @InjectRepository(App) private appRepository: Repository<App>,
        @InjectRepository(PartnerToken) private partnerTokenRepository: Repository<PartnerToken>,
        @InjectModel(PartnerInvoice.name) private partnerInvoiceModel: Model<PartnerInvoice>,
        private encrypterHelper: EncrypterHelper,
        private ibexService: IbexService,
        private coinService: CoinsService,
        private googleCloudTaskService: GoogleCloudTasksService,
        private sendGridService: SendGridService,
        private smsService: SmsService,
        private jwtService: JwtService,
    ){}

    async notifyBankTransaction(transactionId: string, status: PartnerStatus){
        const storedInvoice = await this.partnerInvoiceModel.findOne({
            transactionId: transactionId,
        })
        if(storedInvoice){
            const partnerApp = await this.appRepository.findOneBy({name: storedInvoice.partner})
            this.addNotifierToQueue({
                referenceId: storedInvoice.referenceId,
                event: status,
                webhookURL: partnerApp.webhookURL,
                secretKey: `${partnerApp.clientId}@${partnerApp.clientSecret}`
            })
        }
    }

    private makeid() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == "x" ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
    }

    private async getTokensForPartner(appName: string) {
    appName = appName.toUpperCase();
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: appName,
        },
        {
          secret: process.env.PARTNER_ACCESS_SECRET,
          expiresIn: '1h',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: appName,
        },
        {
          secret: process.env.PARTNER_REFRESH_SECRET,
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
    }

    async storeTokensForPartner(app: App, tokens: any) {
        const encryptedRefreshToken = await this.encrypterHelper.encrypt(
            tokens.refreshToken,
          );
        await this.partnerTokenRepository.insert({
            app: app,
            refreshToken: encryptedRefreshToken,
        });
    }

    async updateTokensForPartner(tokenRecord: PartnerToken, tokens: any) {
        const encryptedRefreshToken = await this.encrypterHelper.encrypt(
            tokens.refreshToken,
            );
        this.partnerTokenRepository.update(tokenRecord, {
            refreshToken: encryptedRefreshToken,
        });
    }
  
    async refreshToken(refreshToken: string, data: AuthDto,) {
        const app = await this.appRepository.findOneBy({
            clientId: data.clientId,
            clientSecret: data.clientSecret,
        });
        if (!app) throw new UnauthorizedException();
        const encryptedCurrentRefreshToken = await this.encrypterHelper.encrypt(refreshToken);
        const tokenRecord = await this.partnerTokenRepository.findOne({
        where: {
            app: { id: app.id },
            refreshToken: encryptedCurrentRefreshToken,
        },
        });
        if (!tokenRecord) throw new UnauthorizedException();

        const newTokens = await this.getTokensForPartner(app.name);
        this.updateTokensForPartner(tokenRecord, newTokens);
        return newTokens;
  }

    async signIn(data: AuthDto){
        const app = await this.appRepository.findOneBy({
            clientId: data.clientId,
            clientSecret: data.clientSecret,
        });
        if (!app) throw new UnauthorizedException();
        if (app.name.toLowerCase().includes('osmo'))
        throw new UnauthorizedException();

        const tokens = await this.getTokensForPartner(app.name);
        this.storeTokensForPartner(app, tokens);
        return tokens;
    }

    async notifyPendingTransactions() {
        const currentDate = new Date()
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(currentDate.getDate() - 5);
        const invoices = await this.partnerInvoiceModel.find({
            flow: PartnerFlow.NoOsmoUserToWallet,
            status: PartnerStatus.PENDING,
            createdAt: { $lte: fiveDaysAgo }
        })
        const apps = await this.appRepository.find({where: {
            name: In(invoices.map(invoice => invoice.partner))
        }})
        const referencesData: InvoiceReference[] = invoices.map((invoice)  => {
            const partner = apps.find(app => app.name == invoice.partner)
            return ({
                referenceId: invoice.referenceId, 
                event: PartnerStatus.FAILED,
                webhookURL: partner.webhookURL,
                secretKey: `${partner.clientId}@${partner.clientSecret}`
            })
        })
        const ids = invoices.map((invoice) => invoice.id)
        Promise.all(referencesData.map((data) => this.addNotifierToQueue(data)))
        
        if(invoices.length > 0){
            await this.partnerInvoiceModel.findByIdAndUpdate(ids, { status: PartnerStatus.FAILED })
        }
        
    }

    async addNotifierToQueue(referenceData: InvoiceReference){
        if(referenceData.webhookURL == null) return;
        const guid = this.makeid()
        const payload = {
            event: referenceData.event,
            data: {
                id: guid,
                referenceId: referenceData.referenceId
            }
        }
        const body = JSON.stringify(payload);
        const hmac = crypto.createHmac('sha256', referenceData.secretKey);
        hmac.update(body);
        const signature = hmac.digest('hex');
        const headers = {
            'x-Osmo-Signature': signature,
            'Content-Type': 'application/json'
        }
        const externalTask: ExternalTask = {
            body: payload,
            headers: headers,
            queue: this.QUEUE_NOTIFIER,
            url: referenceData.webhookURL
        }

        await this.partnerInvoiceModel.findOneAndUpdate({referenceId: referenceData.referenceId}, {status: referenceData.event})
        this.googleCloudTaskService.createExternalTask(externalTask)
    }

    async getUserbyPhone(queries: GetUserbyPhoneDto): Promise<any> {
        const phoneNumber = `+${queries.phoneNumber}`
        const user = await this.userRepository.findOne({
            relations: {verifications: true},
            where: {
                mobile: phoneNumber
            }
        })
        //if(!user) throw new NotFoundException('User not found')
        const [banks, strikeConfig, coins] = await Promise.all([
            this.bankRepository.find({select: {id: true,name: true}}),
            (await this.partnerConfigRepository.find())[0],
            this.coinService.getAll()
        ])
        const gtqCoin = coins.find((coin) => coin.acronym == CoinEnum.GTQ)

        const minSendAmount = {
            coin: gtqCoin.acronym,
            amount: strikeConfig.min
        }

        const maxSendAmount = {
            coin: gtqCoin.acronym,
            amount: strikeConfig.max
        }
        const requirements = [
            {
                name: "bankAccountHolder",
                type: "string",
                description: "Account Holder Name"
            },
            {
                name: "bankAccountNumber",
                type: "string",
                description: "Bank Account Number"
            },
            {
                name: "accountType",
                type: "option",
                description: "Bank Account Type",
                options: ['SAVINGS','CHECKING']
            },
            {
                name: "bankName",
                type: "option",
                description: "Bank Name",
                options: banks
            }
        ]
        const data = {}
        let newUser = {}
        if(user){
            newUser = {
              avatarUrl: user.profilePicture,
              firstName: user.firstName,
              lastName: user.lastName,
              phoneNumber: user.mobile,
              nationality: user.nationality,
              kycStatus: user.verifications.kyc
            }
        }
        data['user'] = newUser
        data['minSendAmount'] = minSendAmount
        data['maxSendAmount'] = maxSendAmount
        
        data['requirements'] = requirements

        return data
    }

    async generateInvoice(authUser: AuthUser,data: PartnerGenerateInvoiceDto){
        const phoneNumber = `+${data.phoneNumber}`

        const user = await this.userRepository.findOne({
            relations: {verifications: true},
            where: {
                mobile: phoneNumber
            }
        }) 
        //if(!user) throw new NotFoundException('User not found')
        if(user && data.flowType == PartnerFlow.NoOsmoUserToWallet) throw new BadRequestException('Incorrect flowType since user exists')      
        if(data.bankAddress !== undefined && data.flowType != PartnerFlow.OsmoUserToBank) throw new BadRequestException('Incorrent flowType since bankData contains data')
        if(data.bankAddress === undefined && data.flowType == PartnerFlow.OsmoUserToBank) throw new BadRequestException('Bank address can not be empty since flow is OsmoUserToBank')
        const checkInvoice = await this.partnerInvoiceModel.findOne({referenceId: data.referenceId})
        if(checkInvoice) throw new BadRequestException('Invoice with that referenceId already exists')
        const [gtqRate, btcPriceResponse, partnerConfig] = await Promise.all([
            this.coinService.getGTQExchangeRate(),
            this.ibexService.getBtcExchangeRate(),
            this.partnerConfigRepository.find()
        ])
        const btcPrice = btcPriceResponse.rate            
        let bank: Bank
        let ibexAccountId = process.env.IBEX_NATIVE_OSMO_ACCOUNT_ID
        let userId = process.env.IBEX_NATIVE_OSMO_ACCOUNT_NAME
        const usdAmount = new Decimal(btcPrice).mul(data.amount).mul(Math.pow(10,-8)).toFixed(2)
        const gtqAmount = new Decimal(usdAmount).mul(gtqRate).toFixed(2)
        const strikeConfig = partnerConfig[0]
        let fee = strikeConfig.normalFee
        if(data.bankAddress !== undefined){
            fee = strikeConfig.withdrawFee
        }
        if(parseFloat(gtqAmount) < strikeConfig.min || parseFloat(gtqAmount) > strikeConfig.max) throw new BadRequestException('Limit out of range')
        if(user){
            const ibexAccount = await this.ibexAccountRepository.findOne({
                where: {
                    user: {id: user.id}
                }
            })
            userId = user.id
            ibexAccountId = ibexAccount.account
        }
        if(data.bankAddress !== undefined){
            bank = await this.bankRepository.findOneBy({id: data.bankAddress.bankId})
            if(!bank) throw new BadRequestException('Invalid bank')
        }

        const mSats = data.amount * 1000
        const invoice = await this.ibexService.generateInvoiceForStrike(ibexAccountId,mSats,userId,data.referenceId)
        const targetAmount  = new Decimal(gtqAmount).minus(new Decimal(gtqAmount).times(fee)).toFixed(2)
        const partnerInvoice = new this.partnerInvoiceModel({
            referenceId: data.referenceId,
            flow: data.flowType,
            bankAccount: data.bankAddress == undefined ? {} : {
                accountNumber: data.bankAddress.accountNumber,
                accountHolder: data.bankAddress.accountHolder,
                accountType: data.bankAddress.accountType,
                bankName: bank.name,
                bankCode: bank.code,
            },
            description: data.description,
            phoneNumber: phoneNumber,
            bolt11: invoice.invoice.bolt11,
            originalAmount: {
                amount: parseFloat(gtqAmount),
                currency: 'GTQ',
            },
            targetAmount: {
                amount: parseFloat(targetAmount),
                currency: 'GTQ'
            },
            sourceAmount: {
                amount: data.amount,
                currency: 'SATS'
            },
            btcPrice: btcPrice,
            status: PartnerStatus.PENDING,
            partner: authUser.sub
        })
        const savedInvoice = await partnerInvoice.save();
        const invoiceObject = savedInvoice.toObject()
        delete invoiceObject.btcPrice
        delete invoiceObject._id
        delete invoiceObject.partner
        delete invoiceObject.originalAmount
        const finalData = {}
        if(user){
            finalData['recipient'] = {
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.mobile,
                nationality: user.nationality,
                kycStatus: user.verifications.kyc
            }
        }
        return invoiceObject
    }

    async pay(data: LightningInvoiceDto, query: ReceiveQueryDto){
        try{
            const storedInvoice = await this.partnerInvoiceModel.findOne({
                referenceId: query.referenceId,
            })
            if(!storedInvoice) throw new BadRequestException('Invoice not found')
            const user = await this.userRepository.findOneBy({id: query.userId})
            if(storedInvoice.flow != PartnerFlow.NoOsmoUserToWallet){
                if(!user) throw new BadRequestException('User not found')
            }
            
            let strategy : PartnerFlowStrategy
            switch(storedInvoice.flow){
                case(PartnerFlow.OsmoUserToWallet):
                strategy = new OsmoWalletUserFlow(
                    this.appRepository.manager,
                    storedInvoice,
                    this.ibexService,                    
                    user,
                    data
                    )
                break
                case(PartnerFlow.OsmoUserToBank):
                strategy = new OsmoWalletUserBank(
                    this.appRepository.manager,
                    storedInvoice,
                    this.ibexService,
                    data,
                    user,
                    this.sendGridService,
                    this.partnerInvoiceModel
                )
                break;
                case(PartnerFlow.NoOsmoUserToWallet):
                strategy = new NoOsmoUserWallet(
                    this.appRepository.manager,
                    storedInvoice,
                    this.ibexService,
                    )
            }
            if(strategy instanceof NoOsmoUserWallet){
               strategy.notify(this.smsService)
               strategy.redirectToOsmoGtqWallet(data.transaction.invoice.amountMsat)
            }else{
                const context = new PartnerFlowContext(strategy)
                context.execute().then(async response => {
                    if(storedInvoice.flow == PartnerFlow.OsmoUserToBank) return
                    const partnerApp = await this.appRepository.findOneBy({name: storedInvoice.partner})
                    this.addNotifierToQueue({
                        referenceId: storedInvoice.referenceId,
                        event: response,
                        webhookURL: partnerApp.webhookURL,
                        secretKey: `${partnerApp.clientId}@${partnerApp.clientSecret}`
                    })
                })
            }
        }catch(error){
            throw new BadRequestException('Error paying')
        }        
    }
}
