import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import { GetIbanAccountResponse } from './interfaces/get-iban-account-response';
import { DtrTransferResponse } from './interfaces/dtr-transfer-response';
import { DtrLoadTransfer } from './interfaces/dtr-load-transfer';
import { InjectModel } from '@nestjs/mongoose';
import { RidiviAccount, RidiviIbanAccount } from 'src/schemas/solfinAccount.schema';
import { Model } from 'mongoose';
import { UpdateBalanceTransferType } from 'src/modules/balance-updater/enums/type.enum';
import * as crypto from 'crypto';
import { KycService } from 'src/modules/kyc/kyc.service';
import { UsersService } from 'src/modules/users/users.service';
import { RawKyc } from 'src/modules/kyc/interfaces/raw-kyc';
import { getNameSplitted } from 'src/modules/kyc/helpers/name-extracter';
import { Country } from 'src/schemas/countries.schema';
import { generateRandomPassword } from 'src/common/helpers/password-generator';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { RidiviNewUserResponse } from './interfaces/new-user-response';
import { GoogleCloudTasksService } from '../google-cloud-tasks/google-cloud-tasks.service';
import { CreateRidiviAccount } from './interfaces/create-account';
import { Status } from 'src/common/enums/status.enum';
import { RidiviCurrency } from './enums/currency.enum';
import { InternalTransfer } from 'src/common/interfaces/internal-transfer';
import { ConfigService } from '@nestjs/config';
import { RidiviExternalTransfer } from './interfaces/external-transfer';
import { RidiviStatusTransaction } from './interfaces/ridivi-status-transaction';
import { CheckRidiviTransferStatusDto } from './dtos/check-transfer-status';
import { RidiviExternalTransferType } from './enums/transfer-type.enum';
import { RidiviAccountResponse } from './interfaces/account';
import { SinpeWithdraw } from 'src/modules/withdraw/strategies/sinpe.strategy';
import { PushNotificationService } from 'src/modules/push-notification/push-notification.service';
import { EntityManager } from 'typeorm';
import { SinpeFunding } from 'src/modules/funding/strategies/sinpe.strategy';
import { RidiviStrategy } from './interfaces/strategy';
import { RidiviWebhookPayload } from './interfaces/webhook-payload';
import { RegisterRidiviNumber } from './interfaces/register-number';
import { LoadTransferSinpeMovil } from './interfaces/sinpe-movil-load-transfer';
import { SinpeMovilTransferLoadedResponse } from './interfaces/sinpe-movil-load-transfer-response';
import { SendSinpeMovil } from './interfaces/send-sinpe-movil';

type RidiviFile = {
    url: string;
    fileName: string;
};
@Injectable()
export class RidiviService {
    private RIDIVI_QUEUE: string;
    private RIDIVI_ACCOUNT_URL: string;
    private RIDIVI_REGISTER_MOBILE_URL: string;
    private baseURL: string;
    private payURL: string;
    private CHECK_TRANSFER_STATUS_URL: string;
    private strategies: Map<RidiviExternalTransferType, RidiviStrategy>;

    constructor(
        @InjectModel(RidiviAccount.name) private ridiviAccountModel: Model<RidiviAccount>,
        @InjectModel(Country.name) private countryModel: Model<Country>,
        @Inject('REQUEST_SCOPED_ENTITY_MANAGER') private manager: EntityManager,
        private googleTaskService: GoogleCloudTasksService,
        private pushNotificationService: PushNotificationService,
        private userService: UsersService,
        private kycService: KycService,
        private configService: ConfigService,
    ) {
        this.RIDIVI_QUEUE = `RIDIVI-${configService.getOrThrow('ENV')}`;
        this.RIDIVI_ACCOUNT_URL = `https://${configService.getOrThrow('DOMAIN')}/ridivi/accounts`;
        this.RIDIVI_REGISTER_MOBILE_URL = `https://${configService.getOrThrow('DOMAIN')}/ridivi/register-number`;
        this.baseURL = configService.getOrThrow('RIDIVI_URL');
        this.payURL = configService.getOrThrow('RIDIVI_PAY_URL');
        this.CHECK_TRANSFER_STATUS_URL = `https://${configService.getOrThrow('DOMAIN')}/ridivi/check-transfer-status`;
        this.strategies = new Map<RidiviExternalTransferType, RidiviStrategy>([
            [RidiviExternalTransferType.TFT, new SinpeWithdraw(this.manager, this.googleTaskService, this.pushNotificationService)],
            [RidiviExternalTransferType.DTR, new SinpeFunding(this.manager)],
        ]);
    }

    async fetchAndInsertCountries() {
        try {
            const response = await axios.get('https://restcountries.com/v3.1/all');
            const countries = response.data.map((country: { cca2: string; cca3: string; ccn3: string; name: { common: string } }) => ({
                cca2: country.cca2,
                cca3: country.cca3,
                ccn3: country.ccn3,
                name: country.name.common,
            }));
            const countriesFiltered = countries.filter((c: { ccn3: string }) => c.ccn3 != undefined);
            await this.countryModel.insertMany(countriesFiltered);
            console.log('Countries successfully inserted into the database');
        } catch (error) {
            console.error('Failed to fetch and insert countries:', error);
        }
    }

    private async uploadFile(ridiviFile: RidiviFile) {
        const fileResponse = await fetch(ridiviFile.url);
        const buffer = await fileResponse.buffer();
        const base64Image = buffer.toString('base64');
        const key = await this.getKey();
        const modifiedBase64Image = `data:image/jpeg;base64,${base64Image}`;
        const body = {
            option: 'uploadFiles',
            key: key,
            name: ridiviFile.fileName,
            contend: modifiedBase64Image,
        };
        const response = await axios.post(this.payURL ?? '', body);
        console.log(response.data);
    }

    private async createIbanAccount(documentId: string, currency: string) {
        const key = await this.getKey();
        const body = {
            option: 'newAccount',
            key: key,
            cur: currency,
            idNumber: documentId,
            name: `Cuenta en ${currency}`,
        };
        const response = await axios.post(this.payURL ?? '', body);
        return response.data;
    }

    // The documentId should be without prefix idType
    async getUser(documentId: string): Promise<RidiviNewUserResponse> {
        const key = await this.getKey();
        const body = {
            option: 'getUser',
            key: key,
            idNumber: documentId,
        };
        try {
            const response = await axios.post(this.payURL ?? '', body);
            const data = response.data;
            if (data.error == true) {
                throw new BadRequestException(data.message);
            }
            return data;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Could not get user');
        }
    }

    async getAccount(iban: string): Promise<RidiviAccountResponse> {
        const key = await this.getKey();
        const ibanAccount = await this.getIbanAccountByIban(iban);
        const body = {
            option: 'getAccountData',
            key: key,
            iban: iban,
            idNumber: ibanAccount.identification,
        };
        const response = await axios.post(this.payURL ?? '', body);
        return response.data;
    }

    /// Register mobile phone number to SINPE system
    async registerPhoneNumber(data: RegisterRidiviNumber) {
        const isCostaRican = data.phoneNumber.startsWith('+506');
        if (!isCostaRican) throw new BadRequestException('PhoneNumber is not from Costa Rica');
        const phoneNumberWithoutPrefix = data.phoneNumber.replace('+506', '');

        const key = await this.getKey();

        const userRidiviAccount = await this.ridiviAccountModel.findOne({ userId: data.userId });
        if (!userRidiviAccount) throw new BadRequestException('Account not found');
        const crcIban = userRidiviAccount.accounts.find((account) => account.currency == RidiviCurrency.CRC);

        if (!crcIban) throw new BadRequestException('CRC account does not exists');
        const user = await this.getIbanAccountByIban(crcIban.iban);
        const body = {
            option: 'registerNumCh4',
            key: key,
            CuentaInterna: crcIban.iban,
            Identificacion: userRidiviAccount.documentId,
            NombreCliente: `${user.nameOwner}`,
            NumTelefono: phoneNumberWithoutPrefix,
        };
        try {
            const response = await axios.post(`${this.payURL}`, body);
            console.log(body);
            if (response.data.error == true) {
                console.log(response.data);
                throw new BadRequestException(response.data.message);
            }
            console.log(response.data);
            return response.data;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.log(error);
            throw new BadRequestException('Could not register SINPE MOVIL NUMBER');
        }
    }

    /// STEP 2
    async createAccounts(createRidiviAccount: CreateRidiviAccount) {
        let ridiviUser = await this.getUser(createRidiviAccount.documentId);
        const partnerStatus = await this.kycService.getKycPartnerStatuses({ sub: createRidiviAccount.userId });

        if (!ridiviUser.user.active || !partnerStatus) {
            new Promise((resolve) => setTimeout(resolve, 2000)).then(() =>
                this.googleTaskService.createInternalTask(this.RIDIVI_QUEUE, createRidiviAccount, this.RIDIVI_ACCOUNT_URL),
            );
            return;
        }
        const ridiviCurrencies = Object.values(RidiviCurrency);
        await Promise.all(ridiviCurrencies.map((currency) => this.createIbanAccount(createRidiviAccount.documentId, currency)));
        ridiviUser = await this.getUser(createRidiviAccount.documentId);
        const accounts: RidiviIbanAccount[] = ridiviUser.user.accounts.map((account) => ({
            currency: account.cur,
            iban: account.iban,
        }));
        await this.ridiviAccountModel.create({
            accounts: accounts,
            documentId: createRidiviAccount.documentId,
            userId: createRidiviAccount.userId,
        });
        await this.kycService.updateBankKyc({ userId: createRidiviAccount.userId, status: Status.COMPLETED });
    }

    /// STEP 1
    async createUser(userId: string): Promise<any> {
        const user = await this.userService.getUserById(userId);
        const osmoAccount = await this.ridiviAccountModel.findOne({ userId: 'osmo' });
        const rawKyc = (await this.kycService.getRawKyc(userId)) as RawKyc;
        let photos = rawKyc.images;
        if (photos.length === 1) {
            photos = [...photos, ...photos];
        }

        const filePrefixPath = `${osmoAccount?.documentId}/KYC/`;
        const images: RidiviFile[] = photos.map((photoUrl) => {
            const fileName = `${filePrefixPath}${uuidv4()}`;
            return {
                url: photoUrl,
                fileName: fileName,
            };
        });
        await Promise.all(images.map((image) => this.uploadFile(image)));

        const splittedName = getNameSplitted(rawKyc);
        const expDate = rawKyc.fields.find((field) => field.name == 'Expiration date')?.value;
        const dateOfBirth = rawKyc.fields.find((field) => field.name == 'Date of birth')?.value;
        const formattedDateOfBirth = dateOfBirth ? dateOfBirth.split('-').reverse().join('/') : '';
        const formattedExpDate = expDate ? expDate.split('-').reverse().join('/') : '';
        const sex = rawKyc.fields.find((field) => field.name == 'Sex')?.value == 'M' ? 1 : 2;
        const nationality = rawKyc.fields.find((field) => field.name == 'Nationality')?.value;
        let numericCode = 188;
        if (nationality?.length === 2) {
            const country = await this.countryModel.findOne({ cca2: nationality }).exec();
            numericCode = country ? country.ccn3 : 188;
        } else if (nationality?.length === 3) {
            const country = await this.countryModel.findOne({ cca3: nationality }).exec();
            numericCode = country ? country.ccn3 : 188;
        }
        const documentId = rawKyc.verification.documentNumber;
        let idTypeCode = documentId.charAt(0);

        if (!['0', '1', '5', '3'].includes(idTypeCode)) idTypeCode = '9';

        const newPassword = generateRandomPassword();
        const key = await this.getKey();

        const body = {
            option: 'newUser',
            key: key,
            firstName: splittedName.firstName,
            lastName: splittedName.lastName,
            nationality: numericCode.toString(),
            idType: '9',
            NewidNumber: documentId,
            idLocality: '188',
            idExpDate: formattedExpDate,
            NewPassword: newPassword,
            phone: user?.mobile,
            email: user?.email,
            file1: `${images[0]?.fileName}.jpeg`,
            file2: `${images[1]?.fileName}.jpeg`,
            gender: sex,
            dateBirth: formattedDateOfBirth,
        };
        const bodyValues = Object.values(body);
        if (bodyValues.some((value) => value === undefined)) {
            throw new BadRequestException('One or more required fields are undefined.');
        }
        await axios.post(`${this.payURL}`, body);
        const createAccountBody: CreateRidiviAccount = {
            userId: userId,
            documentId: documentId,
        };
        this.googleTaskService.createInternalTask(this.RIDIVI_QUEUE, createAccountBody, this.RIDIVI_ACCOUNT_URL);
        const registerNumberPayload: RegisterRidiviNumber = {
            phoneNumber: user.mobile,
            userId: user.id,
        };
        this.googleTaskService.createInternalTask(this.RIDIVI_QUEUE, registerNumberPayload, this.RIDIVI_REGISTER_MOBILE_URL);
    }

    private async getKey(): Promise<string> {
        try {
            const password = this.configService.getOrThrow<string>('RIDIVI_PASSWORD');
            const encryptedPassword = crypto.createHash('sha1').update(password).digest('hex');
            const response = await axios.post(`${this.payURL}`, {
                option: 'getKey',
                userName: process.env.RIDIVI_USERNAME,
                password: encryptedPassword,
            });
            return response.data.key;
        } catch (error) {
            throw new BadRequestException('Failed to get key from Ridivi API');
        }
    }

    async getToken(): Promise<string> {
        try {
            const response = await axios.post(
                `${this.baseURL}/auth/token`,
                {
                    key: process.env.RIDIVI_CLIENT_ID,
                    secret: process.env.RIDIVI_CLIENT_SECRET,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );

            return response.data.token;
        } catch (error) {
            throw new Error('Failed to fetch token from Ridivi API');
        }
    }

    private async getIbanAccountByIban(iban: string): Promise<GetIbanAccountResponse> {
        const token = await this.getToken();
        try {
            const response = await axios.post(
                `${this.baseURL}/sinpe/getIbanData`,
                {
                    iban: iban,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            return response.data;
        } catch (error) {
            throw new BadRequestException('Could not get iban account');
        }
    }

    // ----- SINPE NORMAL
    private async loadTransfer(data: DtrLoadTransfer): Promise<DtrTransferResponse> {
        const token = await this.getToken();
        try {
            const response = await axios.post(`${this.baseURL}/sinpe/loadTransfer`, data, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data;
        } catch (error) {
            throw new BadRequestException('Failed to fetch token from Ridivi API');
        }
    }

    private async sendTransferLoaded(loadKey: string): Promise<DtrTransferResponse> {
        const token = await this.getToken();
        try {
            const response = await axios.post(
                `${this.baseURL}/sinpe/sendLoadedTransfer`,
                {
                    loadKey: loadKey,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            const ridiviResponse = <DtrTransferResponse>response.data;
            if (ridiviResponse.stateOperationDesc == 'RECHAZADA') {
                throw new BadRequestException(ridiviResponse.reasonDesc);
            }

            return response.data;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Failed to send loaded transfer via Ridivi API');
        }
    }

    async checkTransferStatus(body: CheckRidiviTransferStatusDto) {
        const response = await this.getLoadedTransfer(body.loadedKey);
        let status: Status = Status.COMPLETED;
        if (response.stateOperation == 2) {
            // In process
            console.log('looping consulting yet');
            setTimeout(() => {
                //this.checkTransferStatus(body)
                this.googleTaskService.createInternalTask(this.RIDIVI_QUEUE, body, this.CHECK_TRANSFER_STATUS_URL);
            }, 2000);
            return;
        }
        if (response.stateOperationDesc == 'EXITOSA') {
            // EXITOSA
            status = Status.COMPLETED;
        }
        if (response.stateOperationDesc == 'RECHAZADA') {
            // RECHAZADA
            status = Status.FAILED;
        }

        const payload: RidiviStatusTransaction = {
            status: status,
            transactionGroupId: body.transactionGroupId,
            error: response.reasonDesc,
        };
        const strategy = this.strategies.get(body.type);
        if (!strategy) throw new BadRequestException('Ridivi update strategy not found');
        await strategy.updateTransaction(payload);
    }

    async getLoadedTransfer(loadedKey: string): Promise<DtrTransferResponse> {
        const token = await this.getToken();
        try {
            const response = await axios.post(
                `${this.baseURL}/sinpe/getLoadedTransfer`,
                {
                    loadKey: loadedKey,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            return response.data;
        } catch (error) {
            throw new Error('Failed to send loaded transfer via Ridivi API');
        }
    }

    /// Create external transfer to external IBAN
    async createExternalTransfer(data: RidiviExternalTransfer) {
        const userAccount = await this.ridiviAccountModel.findOne({ userId: data.userId });
        const userIbanAccount = userAccount?.accounts.find((account) => account.currency == data.currency);
        if (!userIbanAccount) throw new BadRequestException('User iban account not found');
        const [accountFrom, accountTo] = await Promise.all([
            this.getIbanAccountByIban(userIbanAccount?.iban),
            this.getIbanAccountByIban(data.iban),
        ]);
        const transferData: DtrLoadTransfer = {
            amount: data.amount,
            currency: data.currency,
            toIban: data.iban,
            toId: accountTo.identification,
            time: data.type,
            text: 'External Transfer',
            service: 'External Transfer',
            fromIban: userIbanAccount?.iban ?? '',
            fromId: accountFrom.identification,
        };
        const transferLoaded = await this.loadTransfer(transferData);
        await this.sendTransferLoaded(transferLoaded.loadKey);
        this.checkTransferStatus({
            loadedKey: transferLoaded.loadKey,
            transactionGroupId: data.transactionGroupId,
            type: data.type,
        });
    }

    /// Create internal transfer (Osmo to User) - (User to Osmo)
    async createInternalTransfer(data: InternalTransfer) {
        const userAccount = await this.ridiviAccountModel.findOne({ userId: data.userId });
        const userIbanAccount = userAccount?.accounts.find((account) => account.currency == data.currency);
        const osmoAccount = await this.ridiviAccountModel.findOne({ userId: 'osmo' });
        const osmoIbanAccount = osmoAccount?.accounts.find((account) => account.currency == data.currency);
        let ibanFrom, ibanTo, toId, fromId;
        if (!userIbanAccount) throw new BadRequestException('User iban account not found');
        if (!osmoIbanAccount) throw new BadRequestException('Osmo iban account not found');
        const [userRidiviAccount, osmoRidiviAccount] = await Promise.all([
            this.getIbanAccountByIban(userIbanAccount.iban),
            this.getIbanAccountByIban(osmoIbanAccount.iban),
        ]);

        if (data.type == UpdateBalanceTransferType.OSMO_TO_USER) {
            ibanFrom = osmoRidiviAccount.accountNumber;
            ibanTo = userRidiviAccount.accountNumber;
            fromId = osmoRidiviAccount.identification;
            toId = userRidiviAccount.identification;
        } else {
            ibanFrom = userRidiviAccount.accountNumber;
            ibanTo = osmoRidiviAccount.accountNumber;
            fromId = userRidiviAccount.identification;
            toId = osmoRidiviAccount.identification;
        }
        const transferData: DtrLoadTransfer = {
            amount: data.amount,
            currency: data.currency,
            toIban: ibanTo ?? '',
            toId: toId ?? '',
            time: 'tft',
            text: 'Internal Transfer',
            service: 'Internal Transfer',
            fromIban: ibanFrom ?? '',
            fromId: fromId ?? '',
        };

        const transferLoaded = await this.loadTransfer(transferData);
        await this.sendTransferLoaded(transferLoaded.loadKey);
    }

    //---------------------- SINPE MOVIL
    private async sendTransferCh4(loadedKey: string) {
        const key = await this.getKey();
        const body = {
            option: 'sendLoadTransferCh4',
            key: key,
            loadKey: loadedKey,
        };
        try {
            const response = await axios.post(`${this.payURL}`, body);
            if (response.data.error == true) {
                throw new BadRequestException(response.data.result.Descripcion);
            }
            console.log(response.data);
            return response.data;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Transfer could not be sent');
        }
    }

    private async loadTransferCh4(data: LoadTransferSinpeMovil): Promise<SinpeMovilTransferLoadedResponse> {
        const key = await this.getKey();
        const body = {
            option: 'loadTransferCh4',
            key: key,
            IbanOrigen: data.iban,
            NumTelefonoDestino: data.phoneNumber,
            Descripcion: 'Mobile transfer',
            Moneda: '1',
            Monto: data.amount,
        };
        try {
            const response = await axios.post(`${this.payURL}`, body);
            if (response.data.error == true) {
                throw new BadRequestException(response.data.message);
            }
            return response.data;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Transfer could not be loaded');
        }
    }

    async sendSinpeMovil(data: SendSinpeMovil) {
        const userAccount = await this.ridiviAccountModel.findOne({ userId: data.userId });
        const userIbanAccount = userAccount?.accounts.find((account) => account.currency == RidiviCurrency.CRC);
        if (!userIbanAccount) throw new BadRequestException('User iban account not found');
        const loadedKey = await this.loadTransferCh4({
            amount: data.amount.toString(),
            iban: userIbanAccount.iban,
            phoneNumber: data.phoneNumber,
        });
        await this.sendTransferCh4(loadedKey.loadKey);
    }

    async manageEvent(data: RidiviWebhookPayload) {
        const errorResponse = {
            status: 'B',
            code: 0,
            error: true,
            message: `Recibido con error`,
            result: 'Recibido',
        };
        const strategy = new SinpeFunding(this.manager);
        const userRidiviAccount = await this.ridiviAccountModel.findOne({ 'accounts.iban': data.destination.iban });
        if (!userRidiviAccount) return errorResponse;
        const transactionId = await strategy.createIncomingTransaction(data, userRidiviAccount.userId);
        if (transactionId == null) {
            return errorResponse;
        }
        return {
            status: 'A',
            code: 0,
            error: false,
            message: `Recibido con éxito. Id ${transactionId}`,
            result: 'Recibido',
        };
    }
}
