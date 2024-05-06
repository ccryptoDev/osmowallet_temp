import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Wallet } from 'src/entities/wallet.entity';
import { Repository } from 'typeorm';
import { CoinsService } from '../coins/coins.service';
import { HttpService } from '@nestjs/axios';
import { CreateWalletDto } from './dtos/createWallet.dto';
import { CreateAccountDto } from './dtos/createAccount.dto';

@Injectable()
export class WalletsService {
    constructor(
        @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
        private readonly httpService: HttpService,
        private coinService: CoinsService,
    ) { }

    async getSUMWalletUsers() {
        const coins = await this.coinService.getAll()
        const wallets = await this.walletRepository.createQueryBuilder("wallet")
            .leftJoinAndSelect("wallet.coin", "coin")
            .leftJoin("wallet.account", "account")
            .where("account.alias IS NULL")
            .select(["wallet.coin", "SUM(wallet.balance) as total"])
            .groupBy("wallet.coin.id")
            .getRawMany();
        wallets.forEach(wallet => {
            wallet['coin'] = coins.find(coin => coin.id == wallet.coin_id)
            delete wallet.coin_id
            wallet['total'] = parseFloat(wallet.total)
        })
        return wallets;
    }

    async hideWallet(id: string) {
        await this.walletRepository.update(id, { isActive: false })
    }

    async showWallet(id: string) {
        await this.walletRepository.update(id, { isActive: true })
    }

    async getWalletsByUser(userId: string) {
        const wallets = await this.walletRepository.find({
            relations: {
                coin: true
            },
            where: {
                account: {
                    user: { id: userId }
                }
            }
        })
        return wallets
    }

    async createAccount(createAccountDto: CreateAccountDto) {
        const headers = {
            'x-api-key': '{{apiKey}}',
        };

        try {
            const response = await this.httpService.post(
                'https://api.cryptomate.me/mpc/accounts/create',
                createAccountDto,
                { headers },
            ).toPromise();

            return response.data;
        } catch (error) {
            console.log('error', error);
            throw error;
        }
    }

    async createWallet(accountId: string, createWalletDto: CreateWalletDto) {
        const headers = {
            'x-api-key': '{{apiKey}}',
        };

        try {
            const response = await this.httpService.post(
                `https://api.cryptomate.me/mpc/accounts/${accountId}/wallets/create`,
                createWalletDto,
                { headers },
            ).toPromise();

            return response.data;
        } catch (error) {
            console.log('error', error);
            throw error;
        }
    }

}
