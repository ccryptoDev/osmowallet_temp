import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { IbexService } from '../ibex/ibex.service';
import { InvoiceDto, InvoiceDtoV2 } from './dtos/invoice.dto';
import { ScanDto } from './dtos/scan.dto';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { AuthUser } from '../auth/payloads/auth.payload';
import { Coin } from 'src/entities/coin.entity';
import { CoinEnum } from '../me/enums/coin.enum';
import { HistoricRate } from 'src/entities/historicRates.entity';
import EncrypterHelper from 'src/common/helpers/encrypter.helper';
import { Status } from 'src/common/enums/status.enum';
import Decimal from 'decimal.js';
import { TransactionSubtype } from 'src/common/enums/transactionSubtype.enum';
import { EstimateScanToReceiveDto } from './dtos/estimate.dto';
import * as ln from 'lnurl';
import { ReceiveDto } from './dtos/receive.dto';
import { UsersService } from '../users/users.service';
import { ReceiveMethod } from './enums/receive.enum';
import { FundingDto } from '../funding/dtos/funding.dto';
import { CoinsService } from '../coins/coins.service';
import { FundingMethodEnum } from '../funding/enums/fundingMethod.enum';
import { FundingService } from '../funding/funding.service';
import { findAndLockWallet } from 'src/common/utils/find-and-lock-wallet';

@Injectable()
export class ReceiveService {

    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(IbexAccount) private ibexAccountRepository: Repository<IbexAccount>,
        @InjectRepository(HistoricRate) private historicRateRepository: Repository<HistoricRate>,
        @InjectRepository(Coin) private coinRepository: Repository<Coin>,
        private ibexService: IbexService,
        private encrypterHelper: EncrypterHelper,
        private userService: UsersService,
        private coinService: CoinsService,
        private fundingService: FundingService
    ){}

    async receiveViaLink(body: ReceiveDto, file: Express.Multer.File){
        const user = await this.userService.getUserById(body.userId)
        if(!user) throw new BadRequestException('Invalid user')
        const coins = await this.coinService.getAll()
        const coin = coins.find(coin => coin.id = body.coinId)
        if(!coin) throw new BadRequestException('Invalid coin')
        const userToReceive: AuthUser = {sub: user.id}
        const fundingMethods = await this.fundingService.getAllFundingMethods()
        let fundingMethodId: string
        switch(body.method){
            case(ReceiveMethod.CREDIT_CARD):
            fundingMethodId = fundingMethods.find(method => method.fundingMethod.name == FundingMethodEnum.CREDIT_CARD).id;
            break;
            case(ReceiveMethod.TRANSFER):
            fundingMethodId = fundingMethods.find(method => method.fundingMethod.name == FundingMethodEnum.TRANSFER).id;
            break;
        }
        const data: FundingDto = {
            amount: body.amount,
            coinId: body.coinId,
            data: body.data,
            fundingMethodId: fundingMethodId
        }

        await this.fundingService.fund(userToReceive,data,file)
    }

    async estimateScanToReceive(data: EstimateScanToReceiveDto){
        try{
            const lnurlDecoded = ln.decode(data.address)
            const k1 = lnurlDecoded.split('k1=')[1]
            const decodedLNURLByIbex = await this.ibexService.decodeWithdrawLNURL(k1)
            return {amount: decodedLNURLByIbex.minWithdrawable / 1000}
        }catch(error){
            throw new BadRequestException('Invalid address')
        }
    }

    async scanToReceive(authUser: AuthUser, data: ScanDto){
        let amount = 0
        const lastHistoricRate = (await this.historicRateRepository.find({
            order: {id: 'DESC'},
            take: 1
        }))[0]

        const ibexAccount = await this.ibexAccountRepository.findOneBy({user: {id: authUser.sub}})
        const coin = await this.coinRepository.findOneBy({acronym: CoinEnum.SATS})
        const lnurlDecoded = ln.decode(data.address)
        const k1 = lnurlDecoded.split('k1=')[1]
        const decodedLNURLByIbex = await this.ibexService.decodeWithdrawLNURL(k1)
        const scanResponse = await this.ibexService.scanToReceive(decodedLNURLByIbex.minWithdrawable,k1,decodedLNURLByIbex.callback,ibexAccount.account)
        const amountSats = new Decimal(scanResponse.amount).dividedBy(1000).toNumber();
        await this.userRepository.manager.transaction('SERIALIZABLE',async transactionalEntityManager => {
            //const invoice = await this.ibexService.getInvoiceFromBolt11(scanResponse.invoice.bolt11)
            amount = amountSats
            const wallet = await findAndLockWallet({
                coinId: coin.id,
                entityManager: transactionalEntityManager,
                userId: authUser.sub
            })
            wallet.availableBalance = new Decimal(wallet.availableBalance).plus(amountSats).toNumber();
            wallet.balance = new Decimal(wallet.balance).plus(amountSats).toNumber();
            await transactionalEntityManager.save(wallet)
           
            const transactionGroup = transactionalEntityManager.create(TransactionGroup,{
                fromUser: {id: authUser.sub},
                status: Status.COMPLETED,
                type: TransactionType.RECEPTION,
                transactionCoin: coin,
                btcPrice: data.btcPrice,
                historicRate: lastHistoricRate,
            })
            await transactionalEntityManager.insert(TransactionGroup,transactionGroup)
            const transaction = transactionalEntityManager.create(Transaction,{
                amount: amountSats,
                balance: wallet.availableBalance,
                wallet: wallet,
                subtype: TransactionSubtype.CREDIT_BTC_TRANSFER_LN,
                transactionGroup: transactionGroup
            })

            await transactionalEntityManager.insert(Transaction,transaction)
       })
       return {amount: amount};
    }

    async generateInvoice(authUser: AuthUser, data: InvoiceDto | InvoiceDtoV2){
        const encryptedPayload = await this.encrypterHelper.encryptPayload(data.btcPrice.toString())
        const user = await this.userRepository.findOneBy({id:authUser.sub})
        if(!user) throw new NotFoundException('Usuario inválido')
        const ibexAccount = await this.ibexAccountRepository.findOneBy({user:{id:authUser.sub}})
        if(!ibexAccount) throw new NotFoundException('Cuenta inválida')            
        const invoiceResponse = await this.ibexService.generateInvoice(ibexAccount.account,data.amountSats,encryptedPayload)
        return {address: invoiceResponse.invoice.bolt11}
    }
}
