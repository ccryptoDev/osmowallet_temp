import { BadRequestException, GatewayTimeoutException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Model } from 'mongoose';
import { IbexServiceException } from 'src/common/exceptions/ibex.exception';
import EncrypterHelper from 'src/common/helpers/encrypter.helper';
import { RedisService } from 'src/common/services/redis/redis.service';
import { Coin } from 'src/entities/coin.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { IbexToken } from 'src/entities/ibexToken.entity';
import { Addresses } from 'src/schemas/addresses.schema';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { Repository } from 'typeorm';
import { SendDto } from '../send/dtos/send.dto';
import { UsernameMsService } from '../username-ms/username-ms.service';
import { UsersService } from '../users/users.service';
import { CreateIbexAddressesDto } from './dtos/create-addresses.dto';
import { CreateIbexUsernameDto } from './dtos/create-username.dto';
import { CreateIbexAccountData } from './entities/account.data';
import { IbexAccountDetails } from './entities/accountDetails';
import { DecodedWithdrawLNURL } from './entities/decodedWithdrawLNURL.dto';
import { IbexInvoice } from './entities/ibexInvoice';
import { IbexLightningTransaction } from './entities/ibexLightningTransaction';
import { PayLnURLResponse } from './entities/payLnurlResponse';
import { PayOnChainResponse } from './entities/payOnChain';
import { IbexRate } from './entities/rate';
import { CurrencyEnum } from './enum/currencies.enum';
import { Types } from './enum/type.enum';
import { AuthUser } from '../auth/payloads/auth.payload';




@Injectable()
export class IbexService {
    private BASE_URL: string = process.env.IBEX_BASE_URL
    private CREATE_IBEX_ADDRESS_QUEUE = `CREATE-IBEX-ADDRESS-${process.env.ENV}`
    private CREATE_IBEX_ADDRESS_URL = `https://${process.env.DOMAIN}/ibex/addresses`
    private CREATE_USERNAME_ADDRESS_QUEUE = `CREATE-IBEX-USERNAME-ADDRESS-${process.env.ENV}`
    private CREATE_USERNAME_ADDRESS_URL = `https://${process.env.DOMAIN}/ibex/usernames`
    private IBEX_TOKEN_KEY = `ibex-token`

    constructor(
        @InjectRepository(IbexToken) private ibexTokenRepository: Repository<IbexToken>,
        @InjectModel(Addresses.name) private addressesModel: Model<Addresses>,
        @InjectRepository(IbexAccount) private ibexAccountRepository: Repository<IbexAccount>,
        @InjectRepository(Coin) private coinRepository: Repository<Coin>,
        private encrypterHelper: EncrypterHelper,
        private googleTaskService: GoogleCloudTasksService,
        private usernameService: UsernameMsService,
        private userService: UsersService,
        private redisService: RedisService
    ) { }

    private async getToken(): Promise<string> {
        const key = this.IBEX_TOKEN_KEY
        const token = await this.redisService.getKeyValue(key)
        if (token) return token

        const ibexAccessToken = (await this.ibexTokenRepository.find())[0]
        const decryptedIbexAccessToken = await this.encrypterHelper.decrypt(ibexAccessToken.accessToken)

        await this.setToken(decryptedIbexAccessToken)
        return await this.getToken()
    }

    private async setToken(token: string) {
        const key = this.IBEX_TOKEN_KEY
        await this.redisService.setKeyValue(key, token)
    }

    async getIbexAccountIdByUserId(userId: string) {
        const key = `${userId}/ibex-account-id`
        let ibexAccountId = await this.redisService.getKeyValue(key);
        if (ibexAccountId) return ibexAccountId;

        const ibexAccount = await this.ibexAccountRepository.findOneBy({ user: { id: userId } });
        if (!ibexAccount) throw new BadRequestException(`Ibex account not found for user ID: ${userId}`);

        ibexAccountId = ibexAccount.account;
        await this.redisService.setKeyValue(key, ibexAccountId);
        return ibexAccountId;
    }

    async createUsername(body: CreateIbexUsernameDto) {
        const user = await this.userService.getUserById(body.userId)
        const response = await this.usernameService.createUsername(body.ibexAccountId, user.username);
        await this.ibexAccountRepository.update(body.accountId, {
            usernameId: response.id,
        });
    }

    async createUserIbexAccount(userId: string) {
        const ibexAccountRecordResponse = await this.createAccount(userId);
        const ibexAccount = this.ibexAccountRepository.create({
            account: ibexAccountRecordResponse.id,
            name: ibexAccountRecordResponse.name,
            user: { id: userId },
        });
        await this.ibexAccountRepository.insert(ibexAccount);
        const body: CreateIbexAddressesDto = {
            ibexAccountId: ibexAccount.account
        }
        this.googleTaskService.createInternalTask(
            this.CREATE_IBEX_ADDRESS_QUEUE,
            body,
            this.CREATE_IBEX_ADDRESS_URL
        )
        const usernameBody: CreateIbexUsernameDto = {
            accountId: ibexAccount.id,
            ibexAccountId: ibexAccount.account,
            userId: userId
        }
        this.googleTaskService.createInternalTask(
            this.CREATE_USERNAME_ADDRESS_QUEUE,
            usernameBody,
            this.CREATE_USERNAME_ADDRESS_URL
        )
    }

    async getAccountDetails(accountId: string): Promise<IbexAccountDetails> {
        try {
            const ibexAccessToken = await this.getToken()

            const headersPayload = {
                Authorization: ibexAccessToken
            }
            const config = {
                url: `/v2/account/${accountId}`,
                method: 'GET',
                baseURL: this.BASE_URL,
                headers: headersPayload
            }
            const response = await axios(config)
            return response.data
        } catch (error) {
            let errorMessage = 'Failed to return account details';
            if (axios.isAxiosError(error) && error.response && error.response.data) {
                errorMessage = error.response.data.error || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            throw new BadRequestException(errorMessage);
        }
    }

    async estimateOnChainAddress(address: string, amount: number) {
        try {
            const ibexAccessToken = await this.getToken()

            const headersPayload = {
                Authorization: ibexAccessToken
            }

            const config = {
                url: `/onchain/estimate-fee?dest_address=${address}&amount_sat=${amount}`,
                method: 'GET',
                baseURL: this.BASE_URL,
                headers: headersPayload
            }

            const response = await axios(config)
            return response.data.feeSat
        } catch (error) {
            let errorMessage = 'Failed to estimate on-chain address';
            if (axios.isAxiosError(error) && error.response && error.response.data) {
                errorMessage = error.response.data.error || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            throw new IbexServiceException(errorMessage);
        }
    }

    async estimateInvoiceAddress(bolt11: string, amountSats: number) {
        try {
            const ibexAccessToken = await this.getToken()

            const headersPayload = {
                Authorization: ibexAccessToken
            }

            const config = {
                url: `/v2/invoice/estimate-fee/?bolt11=${bolt11}&amount=${amountSats * 1000}`,
                method: 'GET',
                baseURL: this.BASE_URL,
                headers: headersPayload
            }
            const response = await axios(config)
            return response.data.amount / 1000
        } catch (error) {
            let errorMessage = 'Failed to estimate invoice address';
            if (axios.isAxiosError(error) && error.response && error.response.data) {
                errorMessage = error.response.data.error || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            throw new IbexServiceException(errorMessage);
        }
    }

    async getBtcExchangeRate(btc: boolean = true): Promise<IbexRate> {
        try {
            const ibexAccessToken = await this.getToken()

            const headersPayload = {
                Authorization: ibexAccessToken
            }
            const extension = btc ? '2/3' : '3/4'
            const config = {
                url: `/v2/currencies/rate/${extension}`,
                method: 'GET',
                baseURL: this.BASE_URL,
                headers: headersPayload
            }
            const response = await axios(config)
            return response.data
        } catch (error) {
            let errorMessage = 'Failed to get BTC exchange rate';
            if (axios.isAxiosError(error) && error.response && error.response.data) {
                errorMessage = error.response.data.error || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            throw new IbexServiceException(errorMessage);
        }
    }

    async sendOnChain(accountId: string, data: SendDto, transactionGroupId?: string): Promise<PayOnChainResponse> {
        try {
            const ibexAccessToken = await this.getToken()
            const config = {
                method: 'POST',
                headers: {
                    'Authorization': ibexAccessToken,
                    'Content-Type': 'application/json'
                },
                baseURL: this.BASE_URL,
                url: 'onchain/send',
                data: {
                    accountId: accountId,
                    amountSat: data.amount,
                    feeSat: data.feeSat,
                    address: data.address,
                    webhookUrl: `https://${process.env.DOMAIN}/webhooks/send-onchain?transactionGroupId=${transactionGroupId}`,
                    webhookSecret: process.env.IBEX_WEBHOOK_SECRET
                }
            }
            const response = await axios(config)
            return response.data
        } catch (error) {
            console.log(data.address)
            console.log(error.response.data)
            let errorMessage = 'Failed to send BTC OnChain';
            if (axios.isAxiosError(error) && error.response && error.response.data) {
                errorMessage = error.response.data.error || errorMessage;
                if (error.response.status == 504) {
                    throw new GatewayTimeoutException()
                } else if (error.response.status == 400) {
                    throw new IbexServiceException(errorMessage)
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
                throw new IbexServiceException(errorMessage)
            }
        }
    }

    async getInvoiceFromBolt11(bolt11: string): Promise<IbexInvoice | null> {
        try {
            const ibexAccessToken = await this.getToken()
            const config = {
                method: 'GET',
                headers: {
                    'Authorization': ibexAccessToken,
                    'Content-Type': 'application/json',
                },
                baseURL: this.BASE_URL,
                url: 'invoice/from-bolt11/' + bolt11,
            }
            const response = await axios(config)
            return response.data
        } catch (error) {
            let errorMessage = 'Failed to get invoice from Bolt11';
            if (axios.isAxiosError(error) && error.response && error.response.data) {
                errorMessage = error.response.data.error || errorMessage;
                if (errorMessage.toLowerCase() == 'invoice not found') {
                    return null
                }
                throw new IbexServiceException(errorMessage);
            } else if (error instanceof Error) {
                errorMessage = error.message;
                throw new IbexServiceException(errorMessage);
            }
        }
    }

    async scanToReceive(amountMSats: number, k1: string, callback: string, accountId: string): Promise<IbexLightningTransaction> {
        try {
            const ibexAccessToken = await this.getToken()
            const config = {
                method: 'POST',
                headers: {
                    'Authorization': ibexAccessToken,
                    'Content-Type': 'application/json'
                },
                baseURL: this.BASE_URL,
                url: 'lnurl/withdraw/account/' + accountId,
                data: {
                    amountMsat: amountMSats,
                    k1: k1,
                    callback: callback,
                }
            }
            const response = await axios(config)
            return response.data
        } catch (error) {
            let errorMessage = 'Failed to scan to receive';
            if (axios.isAxiosError(error) && error.response && error.response.data) {
                if (JSON.stringify(error.response?.data).includes('chk_ibexhub_lnurl_charges_remaining')) {
                    errorMessage += ', maximum withdrawal limit reached';
                } else {
                    errorMessage = error.response.data.error || errorMessage;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            throw new IbexServiceException(errorMessage);
        }
    }

    async decodeWithdrawLNURL(k1: string): Promise<DecodedWithdrawLNURL> {
        try {
            const response = await axios.get(`https://ibexhub.ibexmercado.com/lnurl/withdraw/invoice-requirements?k1=${k1}`)
            return response.data
        } catch (error) {
            let errorMessage = 'Failed to decode Withdraw LNURL';
            if (axios.isAxiosError(error) && error.response && error.response.data) {
                errorMessage = error.response.data.error || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            throw new IbexServiceException(errorMessage);
        }
    }

    async doCashout(bolt11: string, accountId: string, amount: number): Promise<IbexLightningTransaction> {
        try {
            const ibexAccessToken = await this.getToken()
            const config = {
                method: 'POST',
                headers: {
                    'Authorization': ibexAccessToken,
                    'Content-Type': 'application/json'
                },
                baseURL: this.BASE_URL,
                url: 'v2/invoice/pay',
                data: {
                    accountId: accountId,
                    amount: amount,
                    bolt11: bolt11,
                }
            }
            const response = await axios(config)
            return response.data
        } catch (error) {
            let errorMessage = 'Failed to send invoice'
            if (axios.isAxiosError(error) && error.response && error.response.data) {
                errorMessage = error.response.data.error || errorMessage;
                if (error.response.status == 504) {
                    throw new GatewayTimeoutException()
                } else {
                    throw new IbexServiceException(errorMessage)
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
                throw new IbexServiceException(errorMessage)
            }
        }
    }

    async payInvoice(bolt11: string, accountId: string, amount: number, transactionGroupId?: string): Promise<IbexLightningTransaction> {
        try {
            const tokenStartTime = Date.now();
            const ibexAccessToken = await this.getToken()
            const tokenEndTime = Date.now();
            console.log(`Decryption took ${tokenEndTime - tokenStartTime} ms`);
            const config = {
                method: 'POST',
                headers: {
                    'Authorization': ibexAccessToken,
                    'Content-Type': 'application/json'
                },
                baseURL: this.BASE_URL,
                url: 'v2/invoice/pay',
                data: {
                    accountId: accountId,
                    amount: amount,
                    bolt11: bolt11,
                    webhookUrl: `https://${process.env.DOMAIN}/webhooks/pay-ln?transactionGroupId=${transactionGroupId}`,
                    webhookSecret: process.env.IBEX_WEBHOOK_SECRET
                }
            }
            const startTime = Date.now();
            const response = await axios(config)
            const endTime = Date.now();
            console.log(`Request took ${endTime - startTime} ms`)
            return response.data
        } catch (error) {
            let errorMessage = 'Failed to pay invoice'
            if (axios.isAxiosError(error) && error.response && error.response.data) {
                errorMessage = error.response.data.error || errorMessage;
                if (error.response.status == 504) {
                    throw new GatewayTimeoutException()
                } else if (error.response.status == 400) {
                    if (errorMessage.includes('invoice already paid')) {
                        throw new IbexServiceException('invoice already paid')
                    }
                    if (errorMessage.includes('invoice expired')) {
                        throw new IbexServiceException('invoice expired')
                    }
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            console.log(errorMessage)
            throw new IbexServiceException(errorMessage);
        }
    }

    async payLnURL(params: any, amountMsats: number, accountId: string): Promise<PayLnURLResponse> {
        try {
            const ibexAccessToken = await this.getToken()
            const config = {
                method: 'POST',
                headers: {
                    'Authorization': ibexAccessToken,
                    'Content-Type': 'application/json'
                },
                baseURL: this.BASE_URL,
                url: 'lnurl/pay/invoice',
                data: {
                    accountId: accountId,
                    params: params,
                    amountMsat: amountMsats
                }
            }
            const response = await axios.request(config)
            return response.data
        } catch (error) {
            let errorMessage = 'Failed to pay lnurl'
            if (axios.isAxiosError(error) && error.response && error.response.data) {
                errorMessage = error.response.data.error || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            throw new IbexServiceException(errorMessage);
        }
    }

    async getParams(lnurlDecoded: string) {
        try {
            const config = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: lnurlDecoded
            }
            const response = await axios.request(config)
            return response.data
        } catch (error) {
            throw new IbexServiceException(error.response?.data || 'Failed to get params');
        }
    }

    async generateLNURLToBuyAndSell(accountId: string) {
        try {
            const ibexAccessToken = await this.getToken()
            const lnDataPayload = {
                accountId: accountId,
            }
            const headersPayload = {
                Authorization: ibexAccessToken
            }
            const configLNURL = {
                url: '/lnurl/pay',
                method: 'post',
                baseURL: this.BASE_URL,
                data: lnDataPayload,
                headers: headersPayload
            }
            const lnurlResponse = await axios(configLNURL)
            return lnurlResponse.data.lnurl
        } catch (error) {
            let errorMessage = 'Failed to generate a LNURL for purchase'
            if (axios.isAxiosError(error) && error.response && error.response.data) {
                errorMessage = error.response.data.error || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            throw new IbexServiceException(errorMessage);
        }
    }

    async generateInvoice(accountId: string, amountSats: number, memo: string): Promise<IbexLightningTransaction> {
        try {
            const ibexAccessToken = await this.getToken()
            const dataPayload = {
                accountId: accountId,
                amount: amountSats * 1000,
                memo: memo,
                webhookUrl: 'https://' + process.env.DOMAIN + '/webhooks/receive-ln',
                webhookSecret: process.env.IBEX_WEBHOOK_SECRET
            }
            const headersPayload = {
                Authorization: ibexAccessToken
            }
            const config = {
                url: 'v2/invoice/add',
                method: 'post',
                baseURL: this.BASE_URL,
                data: dataPayload,
                headers: headersPayload
            }
            const invoiceResponse = await axios(config)
            return invoiceResponse.data
        } catch (error) {
            let errorMessage = 'Failed to generate an invoice'
            if (axios.isAxiosError(error) && error.response && error.response.data) {
                errorMessage = error.response.data.error || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            throw new IbexServiceException(errorMessage);
        }
    }

    async generateInvoiceForStrike(accountId: string, amountSats: number, userId: string, referenceId: string): Promise<IbexLightningTransaction> {
        try {
            const ibexAccessToken = await this.getToken()
            const url = `https://${process.env.DOMAIN}/partners/pay?userId=${userId}&referenceId=${referenceId}`
            const dataPayload = {
                accountId: accountId,
                amount: amountSats,
                webhookUrl: url,
                webhookSecret: process.env.IBEX_WEBHOOK_SECRET
            }
            const headersPayload = {
                Authorization: ibexAccessToken
            }
            const config = {
                url: 'v2/invoice/add',
                method: 'POST',
                baseURL: this.BASE_URL,
                data: dataPayload,
                headers: headersPayload
            }
            const invoiceResponse = await axios(config)
            return invoiceResponse.data
        } catch (error) {
            let errorMessage = 'Failed to generate an invoice'
            if (axios.isAxiosError(error) && error.response && error.response.data) {
                errorMessage = error.response.data.error || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            throw new IbexServiceException(errorMessage);
        }
    }

    async createOnchainAddress(accountId: string, currency: CurrencyEnum, returnData: boolean = false): Promise<string | null> {

        const ibexAccount = await this.ibexAccountRepository.findOne({
            relations: {
                user: true
            },
            where: { account: accountId }
        })
        const ibexAccessToken = await this.getToken()
        const onChainDataPayload = {
            accountId: ibexAccount.account,
            webhookUrl: `https://${process.env.DOMAIN}/webhooks/receive-onchain?currency=${currency}`,
            webhookSecret: process.env.IBEX_WEBHOOK_SECRET
        }
        const config = {
            url: '/onchain/address',
            method: 'post',
            baseURL: this.BASE_URL,
            data: onChainDataPayload,
            headers: {
                Authorization: ibexAccessToken
            }
        }
        const response = await axios(config)
        const address = response.data.address
        if (returnData) return address
        else {
            const userAddresses = await this.addressesModel.findOne({ user: ibexAccount.user.id });
            userAddresses.addresses.push({
                address: address,
                currency: currency,
                type: Types.ONCHAIN,
            });
            if (userAddresses.addresses.find(a => a.type === Types.ONCHAIN)) {
                const index = userAddresses.addresses.findIndex(a => a.type === Types.ONCHAIN)
                userAddresses.addresses[index].address = address;

                await this.addressesModel.updateOne({ user: ibexAccount.user.id }, userAddresses);
            }
        }
    }

    async createAddresses(accountId: string) {
        const coins = await this.coinRepository.find()
        const ibexAccount = await this.ibexAccountRepository.findOne({
            relations: {
                user: true
            },
            where: { account: accountId }
        })
        if (!ibexAccount) throw new BadRequestException("ibex account not found")
        const userAddresses = await this.addressesModel.findOne({
            user: ibexAccount.user.id,
            addresses: {
                $elemMatch: { type: Types.LNURL }
            }
        })
        if (userAddresses) return
        try {
            const addresses: Array<Addresses["addresses"][0]> = []
            const ibexAccessToken = await this.getToken()
            const lnURLPayerDataPayload = {
                accountId: ibexAccount.account,
            }
            const headersPayload = {
                Authorization: ibexAccessToken
            }
            const configLNURLPayer = {
                url: '/lnurl/pay',
                method: 'post',
                baseURL: this.BASE_URL,
                data: lnURLPayerDataPayload,
                headers: headersPayload
            }

            const lnUrlPayer = await axios(configLNURLPayer)
            addresses.push({
                address: lnUrlPayer.data.lnurl,
                currency: CurrencyEnum.BTC,
                type: Types.LNURL_PAYER,
            })

            for (const coin of coins) {
                const lnDataPayload = {
                    accountId: ibexAccount.account,
                    webhookUrl: `https://${process.env.DOMAIN}/webhooks/receive-ln?currency=${coin.acronym}`,
                    webhookSecret: process.env.IBEX_WEBHOOK_SECRET
                }
                const configLNURL = {
                    url: '/lnurl/pay',
                    method: 'post',
                    baseURL: this.BASE_URL,
                    data: lnDataPayload,
                    headers: headersPayload
                }
                const [lnurlAddress, onchainAddress] = await Promise.all([
                    axios(configLNURL),
                    this.createOnchainAddress(accountId, coin.acronym as CurrencyEnum, true),
                ])

                addresses.push({
                    address: lnurlAddress.data.lnurl,
                    currency: coin.acronym as CurrencyEnum,
                    type: Types.LNURL,
                })
                addresses.push({
                    address: onchainAddress,
                    currency: coin.acronym as CurrencyEnum,
                    type: Types.ONCHAIN,
                })
            }
            await this.addressesModel.updateOne({ user: ibexAccount.user.id }, {
                $set: {
                    addresses: addresses
                }
            })
        } catch (error) {
            console.log(error)
            let errorMessage = `Failed to create Bitcoin addresses for userId ${ibexAccount.user.id}`
            if (axios.isAxiosError(error) && error.response && error.response.data) {
                errorMessage = error.response.data.message || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            throw new IbexServiceException(errorMessage);
        }
    }

    async createAccount(userUuid: string): Promise<CreateIbexAccountData> {
        try {
            const ibexAccessToken = await this.getToken()
            const config = {
                url: '/account/create',
                method: 'post',
                baseURL: this.BASE_URL,
                data: {
                    name: userUuid,
                },
                headers: {
                    Authorization: ibexAccessToken
                }
            }
            const response = await axios(config)
            await this.addressesModel.create({ user: userUuid, addresses: [] })
            return {
                id: response.data.id,
                userId: response.data.userId,
                name: response.data.name
            }
        } catch (error) {
            console.log(error)
            let errorMessage = 'An error occurred while trying to create account with Ibex for user ' + userUuid
            if (axios.isAxiosError(error) && error.response && error.response.data) {
                errorMessage = error.response.data.message || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            throw new IbexServiceException(errorMessage);
        }

    }

    async login() {
        try {
            const config = {
                url: '/auth/signin',
                method: 'post',
                baseURL: this.BASE_URL,
                data: {
                    email: process.env.IBEX_EMAIL,
                    password: process.env.IBEX_PASSWORD
                }
            }
            const response = await axios(config)
            const encryptedAccessToken = await this.encrypterHelper.encrypt(response.data.accessToken)
            const encryptedRefreshToken = await this.encrypterHelper.encrypt(response.data.refreshToken)
            let ibexTokenRecord = (await this.ibexTokenRepository.find())[0]
            if (!ibexTokenRecord) {
                ibexTokenRecord = this.ibexTokenRepository.create({
                    accessToken: encryptedAccessToken,
                    refreshToken: encryptedRefreshToken
                })
            } else {
                ibexTokenRecord.accessToken = encryptedAccessToken
                ibexTokenRecord.refreshToken = encryptedRefreshToken
            }
            await this.ibexTokenRepository.save(ibexTokenRecord)
            await this.setToken(response.data.accessToken)
        } catch (error) {
            console.log(error)
            let errorMessage = 'An error occurred while trying to auto login with Ibex.'
            if (axios.isAxiosError(error) && error.response && error.response.data) {
                errorMessage = error.response.data.message || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            throw new IbexServiceException(errorMessage);
        }
    }

    getAddresses(user: AuthUser) {
        return this.addressesModel.find({ user: user.sub })
    }
}
