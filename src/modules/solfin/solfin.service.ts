import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import axios, { isAxiosError } from 'axios';
import * as FormData from 'form-data';
import fetch from 'node-fetch';
import { CreateNewKycSolfin } from './dtos/createNewKyc.dto';
import * as Sentry from "@sentry/node";
import { SolfinKycStatus } from './interfaces/kycStatus';
import { CreateNewSolfinIbanAccount, SolfinCreateAccountPayload } from './dtos/createNewAccount.dto';
import { SolfingCurrency } from './enums/currency.enum';
import { SolfinAccountResponse } from './interfaces/solfinAccount';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { SolfinWithdrawPayload } from './interfaces/withdraw';
import { InjectModel } from '@nestjs/mongoose';
import { SolfinAccount, SolfinIbanAccount } from 'src/schemas/solfinAccount.schema';
import { Model } from 'mongoose';
import { SolfinFundingPayload } from './interfaces/funding';
import { SolfinInternalTransferPayload } from './interfaces/internalTransfer';
import { UpdateBalanceTransferType } from '../balance-updater/enums/type.enum';
import * as getCountryISO3 from "country-iso-2-to-3";
import { SolfingKycFormData } from '../kyc/interfaces/solfin.kyc.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { KycService } from '../kyc/kyc.service';
import { Status } from 'src/common/enums/status.enum';
import { KycPartnerEnum } from 'src/common/enums/kyc-partner.enum';
import { KycVerification } from 'src/entities/kycVerification.entity';
import { Kyc } from '../kyc/interfaces/kyc.interface';
import { getKycDocumentNumber } from 'src/common/utils/kyc-document-number.util';
import { SinpeMobileWithdrawPayload } from './interfaces/sinpe-withdraw';
import { BalanceUpdaterService } from '../balance-updater/balance-updater.service';
import { SyncBalance } from '../balance-updater/interfaces/sync-balance';


@Injectable()
export class SolfinService implements Kyc{
    private baseURL = 'https://api.didi.cr'
    private SOLFIN_KYC_STATUS_URL = `https://${process.env.DOMAIN}/solfin/kyc/status`
    private SOLFIN_NEW_PERSON_URL = `https://${process.env.DOMAIN}/solfin/person`
    private SOLFIN_NEW_IBAN_URL = `https://${process.env.DOMAIN}/solfin/iban`
    private queue = `SOLFIN-${process.env.ENV}`

    constructor(
        @InjectModel(SolfinAccount.name) private solfinAccountModel: Model<SolfinAccount>,
        @InjectRepository(User) private userRepository: Repository<User>,
        @Inject(forwardRef(() => KycService)) private kycService: KycService,
        private googleCloudTasksService: GoogleCloudTasksService
    ){}

    // This method create a internal transfer between OSMO to User account or viceverse
    async doInternalTransfer(payload: SolfinInternalTransferPayload) {
        try{
            const token = await this.generateAuthToken()
            const osmoSolfinAccount = await this.solfinAccountModel.findOne({userId: 'osmo'})
            const solfinAccount = await this.solfinAccountModel.findOne({userId: payload.userId})
            if(!solfinAccount) return
            const userIban = solfinAccount.accounts.find(account => account.currency == payload.currency)
            const osmoIban = osmoSolfinAccount.accounts.find(account => account.currency == payload.currency)
            const code = await  this.generateTransferToken(solfinAccount.documentId)
            let ibanFrom 
            let ibanTo
            if(payload.internalTransferType == UpdateBalanceTransferType.OSMO_TO_USER){
                ibanFrom = osmoIban.iban,
                ibanTo = userIban.iban
            }else{
                ibanFrom = userIban.iban,
                ibanTo = osmoIban.iban
            }
            const data  = {
                "iban_from": ibanFrom,
                "iban_to": ibanTo,
                "currency": payload.currency,
                "amount": payload.amount,
                "description": 'Osmo internal transfer',
                "code": code
            }
            const config = {
                url: `${this.baseURL}/s2/sinpe/internal-transfer`,
                method: 'POST',
                headers: {
                    'x-access-token': token
                },
                data: data
            }
            const response = await axios(config)
            console.log(response.data)
        }catch(error){
            console.log(error)
            if(isAxiosError(error)){
                if(error.response.status >= 400){
                    throw new BadRequestException(error.response.data.message)
                }
            }
            Sentry.captureException(error)
            throw error
        }
    }

    // This method create a funding transaction using IBAN in Costa rica, the info payload provided
    // should be the same of authenticated user
    async funding(payload: SolfinFundingPayload) {
        try{
            const token = await this.generateAuthToken()
            const solfinAccount = await this.solfinAccountModel.findOne({userId: payload.userId})
            const ibanTo = solfinAccount.accounts.find(account => account.currency == payload.currency)
            const code = await  this.generateTransferToken(solfinAccount.documentId)
            const data  = {
                "iban_to": ibanTo.iban,
                "iban_from": payload.ibanFrom,
                "name_from": payload.nameFrom,
                "email_from": payload.emailFrom,
                "document_from": payload.documentFrom,
                "document_type_from": payload.documentTypeFrom,
                "currency": payload.currency,
                "amount": payload.amount,
                "description": payload.description,
                "code": code
            }
            const config = {
                url: `${this.baseURL}/s2/sinpe/external-transfer-dtr`,
                method: 'POST',
                headers: {
                    'x-access-token': token
                },
                data: data
            }
            const response = await axios(config)
            console.log(response.data)
        }catch(error){
            if(isAxiosError(error)){
                if(error.response.status >= 400){
                    throw new BadRequestException(error.response.data.message)
                }
            }
            Sentry.captureException(error)
            throw error
        }
    }

    // This method create a withdraw from User account to external bank in Costa rica
    async withdraw(data: SolfinWithdrawPayload) {
        const token = await this.generateAuthToken()
        const solfinAccount = await this.solfinAccountModel.findOne({userId: data.userId})
        const ibanFrom = solfinAccount.accounts.find(account => account.currency == data.currency)
        const code = await  this.generateTransferToken(solfinAccount.documentId)
        try{
            const config = {
                url: `${this.baseURL}/s2/sinpe/external-transfer-pin`,
                method: 'POST',
                headers: {
                    'x-access-token': token
                },
                data: {
                    "iban_from": ibanFrom.iban,
                    "iban_to": data.iban_to,
                    "name_to": data.name_to,
                    "email_to": data.email_to,
                    "document_to": data.document_to,
                    "document_type_to": data.document_type_to,
                    "currency": data.currency,
                    "amount": data.amount,
                    "description": data.description,
                    "code": code
                }
            }
            await axios(config)
        }catch(error){
            console.log(error.response.data)
            if(isAxiosError(error)){
                if(error.response.status >= 400){
                    throw new BadRequestException(error.response.data.message)
                }
            }
            Sentry.captureException(error)
            throw error
        }
    }

    // Withdraw usin SINPE MOVIL
    async withdrawWithMobile(data: SinpeMobileWithdrawPayload) {
        const token = await this.generateAuthToken()
        const solfinAccount = await this.solfinAccountModel.findOne({userId: data.userId})
        const ibanFrom = solfinAccount.accounts.find(account => account.currency == data.currency)
        const code = await  this.generateTransferToken(solfinAccount.documentId)
        try{
            const config = {
                url: `${this.baseURL}/s2/sinpe/external-transfer-sinpe-movil`,
                method: 'POST',
                headers: {
                    'x-access-token': token
                },
                data: {
                    "iban_from": ibanFrom.iban,
                    "phone_number_to": data.phoneNumberTo,
                    "email_to": data.emailTo,
                    "currency": data.currency,
                    "amount": data.amount,
                    "description": data.description,
                    "code": code
                }
            }
            await axios(config)
        }catch(error){
            console.log(error.response.data)
            if(isAxiosError(error)){
                if(error.response.status >= 400){
                    throw new BadRequestException(error.response.data.message)
                }
            }
            Sentry.captureException(error)
            throw error
        }
    }

    private async mockCreateNewIbanAccount(ibanAccount: CreateNewSolfinIbanAccount) : Promise<SolfinAccountResponse> {
        const ibanAccounts: SolfinAccountResponse  = {
            currency: ibanAccount.currency,
            iban: '123456789',
        };
        return ibanAccounts;
    }

    /// STEP 1
    /// There are some fields to be filled before create an account in Solfin, this method obtain that form
    /// Some fields are excluded because we can get them from KYC in metamap
    async getForm(kycVerification: KycVerification) {
        if(!kycVerification) throw new BadRequestException('User has not KYC')
        const metamapVerification = await this.kycService.getKycUser(kycVerification.verificationId)
        const documentFields = metamapVerification.documents[0].fields
        let documentNumber = Object.keys(documentFields).find(key => key === 'documentNumber') ? documentFields['documentNumber'].value : null;
        documentNumber = documentNumber.replace(/[-. ]/g, "");

        const response = await this.getSolfinForm()
        const excludedFields = [
            'upload_front','upload_back','doc_adicional','privacy',
            'primer_apellido','segundo_apellido','nombre','sexo','telefono','movil','correo',
            'nationality','id_pais','fecha_nacimiento','id_expiration_date'
        ];
        const fields = response.filter(field => !excludedFields.includes(field.name));
        fields.find(field => field.name == 'identificacion').value = documentNumber
        return fields;
    }

    /// STEP 2
    /// After get Form, we obtain all those fields excluded and get them via Metamap, adapt it and send to Solfin
    async createForm(body: SolfingKycFormData) {
        console.log('1. llegando create createNewSolfinKyc')
        const [verificationRecord, user, formFields]= await Promise.all([
            this.kycService.getKycVerification(body.authUser),
            this.userRepository.findOneBy({id: body.authUser.sub}),
            this.getSolfinForm()
        ])
        this.kycService.getKycUser(verificationRecord.verificationId).then(async metamapKycVerification => {
            let photos = metamapKycVerification.documents[0].photos
            if (photos.length === 1) {
                photos = [...photos, ...photos];
            }
            const [frontUrl, backUrl] = await Promise.all(photos.map(photoUrl => this.uploadFile(photoUrl)))
            const documentFields = metamapKycVerification.documents[0].fields
            const expirationDate = Object.keys(documentFields).find(key => key === 'expirationDate') ? documentFields['expirationDate'].value : null;
            const dateOfBirth = Object.keys(documentFields).find(key => key === 'dateOfBirth') ? documentFields['dateOfBirth'].value : null;
            const sexKyc = Object.keys(documentFields).find(key => key === 'sex') ? documentFields['sex'].value : null;
            const documentNumber = getKycDocumentNumber(metamapKycVerification)
            const sexField = formFields.find(field => field.name == 'sexo')
            const sexName = sexKyc == 'M' ? 'Hombre' : 'Mujer'
            const sex = sexField.options.find((option) => option.option == sexName)
            const residenceISO3 = getCountryISO3(user.residence)
            const nationalityISO3 = getCountryISO3(user.nationality)

            const residenceField = formFields.find(field => field.name == 'id_pais')
            const residence = residenceField.options.find(option => option.code == residenceISO3)

            const nationalityField = formFields.find(field => field.name == 'nationality')
            const nationality = nationalityField.options.find(option => option.code == nationalityISO3)
            const lastNameParts = user.lastName.split(' ');
            const firstLastName = lastNameParts[0];
            const secondLastName = lastNameParts.length > 1 ? lastNameParts[1] : '';
            const data: CreateNewKycSolfin = {
                identificacion: documentNumber,
                tipo_id: body.payload.tipo_id,
                autoridad: body.payload.autoridad,
                nombre: `${user.firstName}`,
                primer_apellido: firstLastName,
                segundo_apellido: secondLastName,
                business_nickname: body.payload.business_nickname,
                business_name: body.payload.business_name,
                sexo: parseInt(sex.value),
                direccion: body.payload.direccion,
                telefono: user.mobile,
                movil: user.mobile,
                correo: user.email,
                actividadeconomica: body.payload.actividadeconomica,
                profesion: body.payload.profesion,
                tiporesidencia: body.payload.tiporesidencia,
                cargo: body.payload.cargo,
                nivelestudio: body.payload.nivelestudio,
                marital: body.payload.marital,
                id_expiration_date: new Date(expirationDate).toISOString(),
                fecha_nacimiento: new Date(dateOfBirth).toISOString(),
                upload_front: frontUrl,
                upload_back: backUrl,
                nationality: nationality.value,
                id_pais: residence.value,
                id_provincia: body.payload.id_provincia,
                id_canton: body.payload.id_canton,
                id_zona: body.payload.id_zona,
                monthly_income: body.payload.monthly_income,
                privacy: true
            }
            console.log(data)
            this.createNewKyc(data).then(async () => {
                const createAccountPayload: SolfinCreateAccountPayload = {
                    document: data.identificacion,
                    document_type: data.tipo_id,
                    userId: user.id
                }
                new Promise(resolve => setTimeout(resolve, 2000)).then(() => this.googleCloudTasksService.createInternalTask(this.queue,createAccountPayload,this.SOLFIN_KYC_STATUS_URL));
            }).catch(error => console.log(error))
            
        }).catch(error => console.log(error))
                
    }

    /// STEP 3
    /// Depends of Solfin Kyc system, we need to check the status every 5 seconds
    async getSolfinKycStatus(body: SolfinCreateAccountPayload) {
        console.log('2. llegando a verificar')
        const response = await this.getKycStatus(body)
        if(response.status == 'approved'){
            const kycPartnerStatus = await this.kycService.getKycPartnerStatuses({ sub: body.userId });
            const solfinKyc = kycPartnerStatus.kycs.find(kyc => kyc.partner === KycPartnerEnum.BANK);
            solfinKyc.status = Status.COMPLETED
            await kycPartnerStatus.save();
            body.sinpeId = response.sinpeId
            this.googleCloudTasksService.createInternalTask(this.queue,body, this.SOLFIN_NEW_PERSON_URL)
        }else{
            if(response.status == 'pending'){
                new Promise(resolve => setTimeout(resolve, 5000)).then(() => this.googleCloudTasksService.createInternalTask(this.queue,body, this.SOLFIN_KYC_STATUS_URL))
            }else{
                const kycPartnerStatus = await this.kycService.getKycPartnerStatuses({ sub: body.userId });
                kycPartnerStatus.kycs.find(kyc => kyc.partner === KycPartnerEnum.BANK).status = Status.REJECTED;
                await kycPartnerStatus.save();
            }
        }
    }

    /// STEP 4
    /// This method create a new person in Solfin core, after Kyc status is Verified
    async createNewPersonFromKyc(data: SolfinCreateAccountPayload) {
        console.log('3. llego a crear new person from kyc')
        try{
            const token = await this.generateAuthToken()
            const response = await axios({
                url: `${this.baseURL}/s2/sinpe/new-person-from-kyc/${data.sinpeId}`,
                method: 'POST',
                headers: {
                    'x-access-token': token
                }
            })
            console.log(`new-person-from-kyc`,response.data)
            
            this.googleCloudTasksService.createInternalTask(this.queue,data, this.SOLFIN_NEW_IBAN_URL)
        }catch(error){
            console.log(error.response.data)
            Sentry.captureException(error)
            throw error
        }
    }

    /// STEP 5
    // Create user iban accounts in USD and CRC
    async createSolfinIbanAccounts(body: SolfinCreateAccountPayload) {
        console.log('4. llego para crear cuentas en solfin service')
        const solfinCurrencies = Object.values(SolfingCurrency);
        const ibanAccounts: CreateNewSolfinIbanAccount[] = solfinCurrencies.map(currency => ({
            currency: currency,
            description: 'Osmo Account',
            document: body.document,
            document_type: body.document_type,
            product_id: 27
        }))
        //const response = await Promise.all(ibanAccounts.map(ibanAccount => this.mockCreateNewIbanAccount(ibanAccount)))
        const response = await Promise.all(ibanAccounts.map(ibanAccount => this.createNewIbanAccount(ibanAccount))) // Wait response and save ibans
        const solfinAccounts: SolfinIbanAccount[] = response.map(account => ({iban: account.iban, currency: account.currency}))
        console.log(solfinAccounts)
        await this.solfinAccountModel.create({
            userId: body.userId,
            documentId: body.document,
            accounts: solfinAccounts
        })
        const payload: SyncBalance = {
            country: 'CR',
            userId: body.userId
        }
        this.googleCloudTasksService.createInternalTask(
            BalanceUpdaterService.queue,
            payload,
            BalanceUpdaterService.SYNC_URL,
        )
    }



    /// HTTP Request to get the current Status of KYC
    private async getKycStatus(data: SolfinCreateAccountPayload) : Promise<SolfinKycStatus>{
        console.log('2. llegango a verificar service')
        const token = await this.generateAuthToken()
        const config = {
            method: 'GET',
            baseURL: this.baseURL,
            url: `/s2/sinpe/kyc/${data.document}`,
            headers: {
                'x-access-token': token
            },
        }
        const response = await axios(config)
        return response.data
    }

    // HTTP request of create form
    private async createNewKyc(data: CreateNewKycSolfin) {
       try{
        const token = await this.generateAuthToken()
        const response = await axios({
            baseURL: this.baseURL,
            url: '/s2/sinpe/new-kyc',
            method: 'POST',
            headers: {
                'x-access-token': token
            },
            data: data
        })
        console.log(response.data)
       }catch(error){
            if(isAxiosError(error)){
                if(error.response.status == 400){
                    console.log(error.response.data)
                }
            }
            Sentry.captureException(error)
            throw error
       }
    }

    // The DNI pictured collected in metamap should be reuploaded here in Solfin CDN
    private async uploadFile(fileURL: string) {
        const token = await this.generateAuthToken()
        const fileResponse = await fetch(fileURL);
        const buffer = await fileResponse.buffer();
        const base64Image = buffer.toString('base64');
        const form = new FormData();
        form.append('file', base64Image, {
            contentType: 'image/jpeg',
            filename: 'image.jpeg', 
        });
        const response = await axios.post(`${this.baseURL}/s2/upload/file`,form,{
            headers: { 
                'x-access-token': token
            },
            data: form
        });
        return response.data.url;
    }

    // HTTP REQUEST of form
    private async getSolfinForm() {
        const token = await this.generateAuthToken()
        const config = {
            method: 'GET',
            url: `${this.baseURL}/s2/sinpe/kyc-form`,
            headers: {
                'x-access-token': token
            }
        };
        const response = await axios(config)
        return response.data.fields
    }

    /// For each request generate a new JWT token
    private async generateAuthToken(){
        const config = {
            method: 'POST',
            url: `${this.baseURL}/users/login`,
            headers: { 
                'Content-Type': 'application/json'
            },
            data: {
                "username": process.env.SOLFIN_USERNAME,
                "password": process.env.SOLFIN_PASSWORD
            }
        };
        const response = await axios(config)
        return response.data.token
    }

    // This method create a request of new temporary One Time Token from Solfin, it is useful for each transaction
    async generateTransferToken(documentId: string) {
        const token = await this.generateAuthToken()
        const config = {
            method: 'GET',
            baseURL: this.baseURL,
            url: `/s2/sinpe/ask-token?doc=${documentId}`,
            headers: {
                'x-access-token': token
            },
        }
        const response = await axios(config)
        return response.data.code
    }

    // Create HTTP request of iban accounts mentionted above
    private async createNewIbanAccount(data: CreateNewSolfinIbanAccount) : Promise<SolfinAccountResponse>{
        try{
            const token = await this.generateAuthToken()
            const config = {
                baseURL: this.baseURL,
                url: '/s2/sinpe/new-account',
                method: 'POST',
                headers: {
                    'x-access-token': token
                },
                data: data
            }
            const response = await axios(config)
            console.log(response.data)
            return {
                iban: response.data.iban,
                currency: data.currency
            }
        }catch(error){
            if(isAxiosError(error)){
                if(error.response.status == 400){
                    console.log(error.response.data)
                }
            }
            Sentry.captureException(error)
            throw error
        }
    }
    

}
