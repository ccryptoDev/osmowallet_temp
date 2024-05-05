import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Wallet } from 'src/entities/wallet.entity';
import { IbexService } from 'src/modules/ibex/ibex.service';
import { In, IsNull, Repository } from 'typeorm';

@Injectable()
export class AdminDashboardService {
    constructor(
        @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
        private ibexService: IbexService
    ){}

    async getMainBalances() {
        const wallets = await this.walletRepository.find({
            relations: {
                coin: true,
                account: true,
            },
            where: {
                account: {
                    alias: In(['fees','main','referral']),
                    user: IsNull()
                }
            }
        })
        const ibexBalanceResponse = await this.ibexService.getAccountDetails(process.env.IBEX_NATIVE_OSMO_ACCOUNT_ID)
        wallets.forEach((wallet) => {
            if(wallet.coin.acronym == 'SATS' && wallet.account.alias == 'main') {
                wallet.balance = ibexBalanceResponse.balance / 1000;
                wallet.availableBalance = ibexBalanceResponse.balance / 1000
            }
        });
        return wallets
    }
}
