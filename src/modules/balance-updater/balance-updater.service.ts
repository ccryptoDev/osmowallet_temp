import { Injectable } from '@nestjs/common';
import { UpdateBalance } from './interfaces/updateBalance';
import { SolfinService } from '../solfin/solfin.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { SyncBalance } from './interfaces/sync-balance';
import { WalletsService } from '../wallets/wallets.service';
import { UpdateBalanceTransferType } from './enums/type.enum';
import { CoinsService } from '../coins/coins.service';

@Injectable()
export class BalanceUpdaterService {
    static queue = `BALANCE-UPDATER-${process.env.ENV}`
    static url = `https://${process.env.DOMAIN}/balance-updater`
    static SYNC_URL = `https://${process.env.DOMAIN}/balance-updater/sync`

    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        private solfinService: SolfinService,
        private walletService: WalletsService,
        private coinService: CoinsService
    ){}

    /// This functions sync balance to third party service only at the first time (Bank account)
    async syncBalance(payload: SyncBalance){
        const wallets = await this.walletService.getWalletsByUser(payload.userId)
        if(payload.country == 'CR'){
            const usdWallet = wallets.find(wallet => wallet.coin.acronym == 'USD')
            if(usdWallet.availableBalance <= 0) return
            await this.solfinService.doInternalTransfer({
                amount: usdWallet.availableBalance,
                currency: 'USD',
                internalTransferType: UpdateBalanceTransferType.OSMO_TO_USER,
                userId: payload.userId
            })
        }
    }

    // this function sync balance to third party service (Bank account) in each transaction
    async updateBalance(payload: UpdateBalance) {
        const user = await this.userRepository.findOneBy({id: payload.userId})
        const coin = await this.coinService.getCoinById(payload.coinId)
        console.log(payload)
        const countryCoins = await this.coinService.getCoinsByResidence(user.residence)
        const isCoinValid = countryCoins.find(coin => coin.id == coin.id)
        if(!isCoinValid) return
        if(user.residence == 'CR'){
            console.log('entrando a solfin balance updater')
            await this.solfinService.doInternalTransfer({
                amount: payload.amount,
                currency: coin.acronym,
                internalTransferType: payload.type,
                userId: payload.userId
            })
        }
    }
}
