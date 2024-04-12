import { EntityManager } from "typeorm";
import { AdminTransaction } from "./create-transaction.interface";
import { CreateAdminTransactionDto, CreditBtcOsmoBusinessDto } from "../dtos/create-transaction.dto";
import { ValidatorData } from "src/common/dto_validators/validator-data";
import { User } from "src/entities/user.entity";
import { BadRequestException } from "@nestjs/common";
import { IbexService } from "src/modules/ibex/ibex.service";
import { Address } from "src/entities/address.entity";
import * as ln from 'lnurl';
import { Wallet } from "src/entities/wallet.entity";
import { CoinEnum } from "src/modules/me/enums/coin.enum";
import Decimal from "decimal.js";
import { TransactionGroup } from "src/entities/transactionGroup.entity";
import { TransactionType } from "src/common/enums/transactionsType.enum";
import { Status } from "src/common/enums/status.enum";
import { TransactionSubtype } from "src/common/enums/transactionSubtype.enum";
import { Coin } from "src/entities/coin.entity";
import { Transaction } from "src/entities/transaction.entity";
import { findAndLockWallet } from "src/common/utils/find-and-lock-wallet";


export class CreditOsmoBusiness implements AdminTransaction {
    private data: CreditBtcOsmoBusinessDto
    constructor(
        private manager: EntityManager,
        private adminTransactionDto: CreateAdminTransactionDto,
        private ibexService: IbexService
    ){}

    async validateData(): Promise<void> {
        this.data = await ValidatorData.validate<CreditBtcOsmoBusinessDto>(this.adminTransactionDto.data, CreditBtcOsmoBusinessDto)
        const user = await this.manager.findOneBy(User, {id: this.data.userId})
        if(!user) throw new BadRequestException('Invalid user')
    }

    async create(): Promise<void> {
        await this.validateData()
        const addresses = await this.manager.findOne(Address,{
            where: {
                user: {id: this.data.userId}
            }
        })
        const coin = await this.manager.findOneBy(Coin,{acronym: CoinEnum.SATS})
        const lnURLDecoded = ln.decode(addresses.lnUrlPayer)
        const params = await this.ibexService.getParams(lnURLDecoded)
        await this.ibexService.payLnURL(params,this.data.amount * 1000,process.env.IBEX_NATIVE_OSMO_ACCOUNT_ID)
        await this.manager.transaction('SERIALIZABLE', async entityManager => {
            const userWallet = await findAndLockWallet({entityManager: entityManager, coinId: coin.id, userId: this.data.userId})

            await entityManager.update(Wallet,userWallet.id, {
                availableBalance: new Decimal(userWallet.availableBalance).plus(this.data.amount).toNumber(),
                balance: new Decimal(userWallet.balance).plus(this.data.amount).toNumber(),
            })
            const transactionGroup = entityManager.create(TransactionGroup, {
                toUser: {id: this.data.userId},
                transactionCoin: {id: coin.id},
                type: TransactionType.CREDIT_BTC_OSMO_BUSINESS,
                status: Status.COMPLETED,
            })
            await entityManager.insert(TransactionGroup,transactionGroup)
            const userTransaction = entityManager.create(Transaction, {
                amount: this.data.amount,
                wallet: {id: userWallet.id},
                balance: userWallet.availableBalance,
                transactionGroup: {id: transactionGroup.id},
                subtype: TransactionSubtype.CREDIT_BTC_TRANSFER_LN
            })
            await entityManager.insert(Transaction,userTransaction)
        })
    }
    
}