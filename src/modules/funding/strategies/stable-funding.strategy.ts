import { BadRequestException } from "@nestjs/common";
import { validate } from "class-validator";
import Decimal from "decimal.js";
import { DynamicDtoValidator } from "src/common/dto_validators/dynamic.validator";
import { MainWalletsAccount } from "src/common/enums/main-wallets.enum";
import { Status } from "src/common/enums/status.enum";
import { TransactionMethodEnum } from "src/common/enums/transactionMethod.enum";
import { TransactionType } from "src/common/enums/transactionsType.enum";
import { TransactionSubtype } from "src/common/enums/transactionSubtype.enum";
import { formatDateToSpanish } from "src/common/utils/date-formatter.util";
import { findAndLockWallet } from "src/common/utils/find-and-lock-wallet";
import { RateType, getStableRate } from "src/common/utils/stable-rate.util";
import { BlockchainNetwork } from "src/entities/blockchainNetworks.entity";
import { Coin } from "src/entities/coin.entity";
import { FundingTransactionLimit } from "src/entities/fundingTransactionLimits.entity";
import { Setting } from "src/entities/setting.entity";
import { TierFunding } from "src/entities/tierFunding.entity";
import { TierUser } from "src/entities/tierUser.entity";
import { TransactionDetail } from "src/entities/transaction.detail.entity";
import { Transaction } from "src/entities/transaction.entity";
import { TransactionFee } from "src/entities/transactionFee.entity";
import { TransactionGroup } from "src/entities/transactionGroup.entity";
import { User } from "src/entities/user.entity";
import { BalanceUpdaterService } from "src/modules/balance-updater/balance-updater.service";
import { UpdateBalanceTransferType } from "src/modules/balance-updater/enums/type.enum";
import { UpdateBalance } from "src/modules/balance-updater/interfaces/updateBalance";
import { CoinEnum } from "src/modules/me/enums/coin.enum";
import { SendGridService } from "src/modules/send-grid/send-grid.service";
import { FundingPendingTemplate } from "src/modules/send-grid/templates/funding/fundingPending.template";
import { FundingPendingOsmoTemplate } from "src/modules/send-grid/templates/funding/fundingPendingOsmo.template";
import { GoogleCloudStorageService } from "src/services/google-cloud-storage/google-cloud-storage.service";
import { GoogleCloudTasksService } from "src/services/google-cloud-tasks/google-cloud-tasks.service";
import { SlackChannel } from "src/services/slack/enums/slack-channels.enum";
import { SlackEmoji } from "src/services/slack/enums/slack-emoji.enum";
import { SlackWebhooks } from "src/services/slack/enums/slack-webhooks.enum";
import { SlackService } from "src/services/slack/slack.service";
import { createTransactionsTemplate } from "src/services/slack/templates/transactions.template";
import { EntityManager } from "typeorm";
import { FundingDto } from "../dtos/funding.dto";
import { StableFundingDto } from "../dtos/stableFunding.dto";
import { FundingMethodEnum } from "../enums/fundingMethod.enum";
import { Funding } from "./funding";




export class StableFunding implements Funding {
    private coin: Coin
    private settings: Array<Setting>
    private stableCoin: Coin
    private blockChainNetwork: BlockchainNetwork
    private methodDto: StableFundingDto

    constructor(
        private googleCloudStorageService: GoogleCloudStorageService,
        private sendgridService: SendGridService,
        private body: FundingDto,
        private manager: EntityManager,
        private user: User,
        private file: Express.Multer.File,
        private googleCloudTaskService: GoogleCloudTasksService
    ) { }

    async fund(): Promise<any> {
        await this.validateInputData()
        await this.setDataToUse()
        const proofData = await this.getProofData(this.file, this.user)
        const usdLowerRate = getStableRate(this.settings, RateType.LOWER, CoinEnum.USD)
        const fiatLowerRate = getStableRate(this.settings, RateType.LOWER, this.coin.acronym)
        const lowerRate = this.coin.acronym == CoinEnum.USD ? usdLowerRate : fiatLowerRate
        const upperRate = this.coin.acronym == CoinEnum.USD ? new Decimal(1) : fiatLowerRate.dividedBy(usdLowerRate)
        const upperRateFixed = new Decimal(upperRate)
        const lowerRateFixed = new Decimal(lowerRate)
        const upperUSDT = new Decimal(new Decimal(this.body.amount).div(upperRateFixed).toFixed(5))
        console.log('upperUSDT', upperUSDT)
        const upperAmount = new Decimal(this.body.amount)
        const lowerAmount = new Decimal(this.body.amount).mul(new Decimal(lowerRate).div(upperRate)).toFixed(2)
        const fee = (new Decimal(upperAmount).minus(new Decimal(lowerAmount))).toFixed(2)
        console.log('upperRate:', upperRateFixed)
        console.log('lowerRate:', lowerRateFixed)

        console.log('upperAmount:', upperAmount)
        console.log('lowerAmount:', lowerAmount)
        console.log('fee:', fee)
        await this.manager.transaction('SERIALIZABLE', async transactionalEntityManager => {
            const [userWallet, osmoWallet, osmoFeeWallet] = await Promise.all([
                findAndLockWallet({ entityManager: transactionalEntityManager, coinId: this.coin.id, userId: this.user.id }),
                findAndLockWallet({ entityManager: transactionalEntityManager, coinId: this.stableCoin.id, alias: MainWalletsAccount.MAIN }),
                findAndLockWallet({ entityManager: transactionalEntityManager, coinId: this.coin.id, alias: MainWalletsAccount.FEES })
            ])

            const transactionGroup = transactionalEntityManager.create(TransactionGroup, {
                status: Status.PENDING,
                type: TransactionType.FUNDING,
                method: TransactionMethodEnum.STABLE_COIN,
                fromUser: { id: this.user.id },
                transactionCoin: this.coin,
                metadata: {
                    stableCoin: this.methodDto.stableCoin,
                    linkExplorer: this.methodDto.linkExplorer,
                    network: this.blockChainNetwork.name,
                }
            })
            await transactionalEntityManager.insert(TransactionGroup, transactionGroup)
            const userTransaction = transactionalEntityManager.create(Transaction, {
                subtype: TransactionSubtype.CREDIT_FIAT_FUNDING,
                amount: parseFloat(lowerAmount),
                balance: userWallet.availableBalance,
                transactionGroup: transactionGroup,
                wallet: userWallet,
            })

            const osmoTransaction = transactionalEntityManager.create(Transaction, {
                subtype: TransactionSubtype.CREDIT_STABLE_OSMO,
                amount: new Decimal(upperUSDT.toFixed(2)).toNumber(),
                balance: osmoWallet.availableBalance,
                transactionGroup: transactionGroup,
                wallet: osmoWallet,
            })

            const feeTransaction = transactionalEntityManager.create(Transaction, {
                subtype: TransactionSubtype.FEE_FUNDING,
                amount: parseFloat(fee),
                balance: osmoFeeWallet.availableBalance,
                transactionGroup: transactionGroup,
                wallet: osmoFeeWallet,
            })

            const feeRecord = transactionalEntityManager.create(TransactionFee, {
                amount: parseFloat(fee),
                coin: this.coin,
                transactionGroup: transactionGroup
            })

            await transactionalEntityManager.insert(Transaction, [userTransaction, osmoTransaction, feeTransaction])
            const transactionDetail = transactionalEntityManager.create(TransactionDetail, {
                transaction: userTransaction,
                proofUrl: proofData.proofUrl,
                proofPath: proofData.proofPath,
                proofExpiry: new Date(proofData.proofUrlExpiry),
            })
            await transactionalEntityManager.insert(TransactionDetail, transactionDetail)
            await transactionalEntityManager.insert(TransactionFee, feeRecord)

            const fundingTransactionLimit = await transactionalEntityManager.findOne(FundingTransactionLimit, {
                where: {
                    user: { id: this.user.id },
                    fundingmethod: { id: this.body.fundingMethodId }
                },
            })

            fundingTransactionLimit.dailyAmassedAmount += new Decimal(upperUSDT.toFixed(2)).toNumber()
            fundingTransactionLimit.monthlyAmassedAmount += new Decimal(upperUSDT.toFixed(2)).toNumber()

            await transactionalEntityManager.save(fundingTransactionLimit)

            this.notify(transactionGroup, this.user, parseFloat(lowerAmount))
        })

        SlackService.notifyTransaction({
            baseURL: SlackWebhooks.TRANSACTIONS_STABLE_COINS,
            data: createTransactionsTemplate({
                channel: SlackChannel.TRANSACTIONS_STABLE_COINS,
                amount: this.body.amount,
                coin: CoinEnum[this.coin.acronym],
                firstName: this.user.firstName,
                lastName: this.user.lastName,
                email: this.user.email,
                transactionType: {
                    name: FundingMethodEnum.STABLE_COIN,
                    emoji: SlackEmoji.COIN,
                    type:  "FUNDING" 
                },
                attachmentUrl: proofData.proofUrl
            })
        })

        const balancePayload: UpdateBalance = {
            amount: parseFloat(lowerAmount),
            coinId: this.coin.id,
            type: UpdateBalanceTransferType.OSMO_TO_USER,
            userId: this.user.id
        }
        this.googleCloudTaskService.createInternalTask(BalanceUpdaterService.queue,balancePayload,BalanceUpdaterService.url)
    }


    private notify(
        transactionGroup: TransactionGroup,
        user: User,
        amount: number        
        ){
        const emails = process.env.ENV == 'PROD' 
        ? [{email: 'victor@osmowallet.com',name: 'Victor'},{email: 'piero@osmowallet.com',name: 'Piero'}] 
        : [{email: 'as@singularagency.co',name: 'Piero'}]
        const date = new Date()
        const template = new FundingPendingOsmoTemplate(
            emails,
            user.firstName + ' ' + user.lastName,
            user.email,
            {
                amount: amount,currency: this.coin.acronym,
                date: formatDateToSpanish(date),
                status: Status.PENDING,
                transactionId: transactionGroup.id
            }
        )
        const confirmationUserTemplate = new FundingPendingTemplate(
            [{ email: user.email, name: user.firstName }],
            {
            amount: amount,
            currency: this.coin.acronym, 
            date: formatDateToSpanish(date),
            status: Status.PENDING,
            transactionId: transactionGroup.id
            },
        )
        this.sendgridService.sendMail(confirmationUserTemplate)
        this.sendgridService.sendMail(template)
    }

    private async getProofData(file: Express.Multer.File, user: User): Promise<{ proofUrl: string, proofPath: string, proofUrlExpiry: number }> {
        const proofUrlExpiry = Date.now() + 3600 * 1000 * 7
        const proofPath = `Users/${user.id}/proofs/${Date.now()}-${file.originalname}`
        await this.googleCloudStorageService.saveFile(file, proofPath)
        const proofUrl = await this.googleCloudStorageService.getSignedUrl(proofPath, proofUrlExpiry)
        return { proofUrl, proofPath, proofUrlExpiry }
    }

    private async setDataToUse() {
        const [stableCoin, settings] = await Promise.all([

            this.manager.findOneBy(Coin, { acronym: 'USDT' }),
            this.manager.find(Setting)
        ])
        this.stableCoin = stableCoin
        this.settings = settings
    }

    private async validateInputData() {
        const stableFundingDto = new StableFundingDto();
        const parsedData = JSON.parse(this.body.data);
        stableFundingDto.networkId = parsedData.networkId;
        stableFundingDto.linkExplorer = parsedData.linkExplorer;
        stableFundingDto.stableCoin = parsedData.stableCoin
        const errors = await validate(stableFundingDto);
        if (errors.length > 0) {
            const messageError = errors.map(error => Object.values(error.constraints)).join(', ');
            throw new BadRequestException(messageError);
        }
        if (!this.file) {
            throw new BadRequestException('File not provided')
        }
        this.methodDto = await DynamicDtoValidator.validateInputData<StableFundingDto>(this.body.data, StableFundingDto)

        const blockChainNetwork = await this.manager.findOneBy(BlockchainNetwork, { id: this.methodDto.networkId })
        if (!blockChainNetwork) throw new BadRequestException('Invalid network')
        const coin = await this.manager.findOneBy(Coin, { id: this.body.coinId })
        if (!coin) throw new BadRequestException('Invalid coin')
        if (coin.acronym == CoinEnum.SATS) throw new BadRequestException('Invalid coin')
        if (!['USD', 'GTQ', 'CRC'].includes(coin.acronym)) throw new BadRequestException('Invalid coin')
        this.coin = coin
        this.blockChainNetwork = blockChainNetwork

        const [fundingTransactionLimit, tierUser] = await Promise.all([
            this.manager.findOne(FundingTransactionLimit, {
                where: {
                    user: { id: this.user.id },
                    fundingmethod: { id: this.body.fundingMethodId }
                },
            }),
            this.manager.findOne(TierUser, {
                where: {
                    user: {
                        id: this.user.id
                    }
                }
            })
        ])

        const dailyAmountToAmass = fundingTransactionLimit.dailyAmassedAmount + (this.body.amount / this.coin.exchangeRate)
        const monthlyAmountToAmass = fundingTransactionLimit.monthlyAmassedAmount + (this.body.amount / this.coin.exchangeRate)

        const tierFunding = await this.manager.findOne(TierFunding, {
            where: {
                fundingMethod: { id: this.body.fundingMethodId },
                tier: tierUser.tier
            },
        })

        if (this.body.amount > tierFunding.max) throw new BadRequestException('Este monto excede el maximo permitido por transacción')
        if (this.body.amount <= tierFunding.min) throw new BadRequestException('Este monto no alcanza el minimo permitido por transacción')
        if (dailyAmountToAmass > tierFunding.dailyLimit) throw new BadRequestException('Alcanzaste tu limite diario')
        if (monthlyAmountToAmass > tierFunding.monthlyLimit) throw new BadRequestException('Alcanzaste tu limite mensual')
    }

}





