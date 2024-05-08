import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Wallet } from 'src/entities/wallet.entity';
import { Repository } from 'typeorm';
import { CoinsService } from '../coins/coins.service';
import { CreateWalletDto } from './dto/createWallet.dto';
import { CreateAccountDto } from './dto/createAccount.dto';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { MongoAccount } from 'src/schemas/account.schema';
import { Model } from 'mongoose';
import { MongoWallet } from 'src/schemas/wallets.schema';
import { Observable } from 'rxjs';

@Injectable()
export class WalletsService {
    constructor(
        @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
        @InjectModel(MongoAccount.name) private readonly mongoCreateAccountModel: Model<MongoAccount>,
        @InjectModel(MongoWallet.name) private readonly mongoCreateWallettModel: Model<MongoWallet>,
        private httpService: HttpService,
        private coinService: CoinsService,
    ) {}

    async getSUMWalletUsers() {
        const coins = await this.coinService.getAll();
        const wallets = await this.walletRepository
            .createQueryBuilder('wallet')
            .leftJoinAndSelect('wallet.coin', 'coin')
            .leftJoin('wallet.account', 'account')
            .where('account.alias IS NULL')
            .select(['wallet.coin', 'SUM(wallet.balance) as total'])
            .groupBy('wallet.coin.id')
            .getRawMany();
        wallets.forEach((wallet) => {
            wallet['coin'] = coins.find((coin) => coin.id == wallet.coin_id);
            delete wallet.coin_id;
            wallet['total'] = parseFloat(wallet.total);
        });
        return wallets;
    }

    async hideWallet(id: string) {
        await this.walletRepository.update(id, { isActive: false });
    }

    async showWallet(id: string) {
        await this.walletRepository.update(id, { isActive: true });
    }

    async getWalletsByUser(userId: string) {
        const wallets = await this.walletRepository.find({
            relations: {
                coin: true,
            },
            where: {
                account: {
                    user: { id: userId },
                },
            },
        });
        return wallets;
    }

    async updateWalletDesactive(walletId: string) {
        const wallet = await this.walletRepository.findOne({
            where: {
                id: walletId,
            },
        });

        if (!wallet) {
            throw new Error('Wallet not found');
        }

        if (wallet?.isActive === false || wallet.availableBalance !== 0) {
            return { message: 'Wallet already has this status or has balance' };
        }

        await this.walletRepository.update(walletId, { isActive: false });

        return { message: 'Wallet status updated' };
    }

    async updateWalletActive(walletId: string) {
        const wallet = await this.walletRepository.findOne({
            where: {
                id: walletId,
            },
        });

        if (!wallet) {
            throw new Error('Wallet not found');
        }

        if (wallet?.isActive === true || wallet.availableBalance !== 0) {
            return { message: 'Wallet already has this status or has balance' };
        }

        await this.walletRepository.update(walletId, { isActive: true });

        return { message: 'Wallet status updated' };
    }
    async createAccount(createAccountDto: CreateAccountDto):Promise<any>{
        const headers = {
            'x-api-key': process.env.CRYPTOMATE_SANDBOX_API_KEY
        };
        const url = process.env.CRYPTOMATE_SANDBOX_API_URL + '/mpc/accounts/create'
        try {
            const response = await this.httpService.post(
                url,
                createAccountDto,
                { headers },
            ).toPromise();
            await this.mongoCreateAccountModel.create(response?.data);
            
            return response?.data;
        } catch (error) {
            console.log('error', error);
            throw error;
        }
    }

    async createWallet(accountId: string, createWalletDto: CreateWalletDto) {
        const headers = {
            'x-api-key': process.env.CRYPTOMATE_SANDBOX_API_KEY
        };
        const url = process.env.CRYPTOMATE_SANDBOX_API_URL + '/mpc/accounts/${accountId}/wallets/create'
        try {
            const response = await this.httpService.post(
                url,
                createWalletDto,
                { headers },
            ).toPromise();
            await this.mongoCreateWallettModel.create(response?.data)
            return response?.data;
        } catch (error) {
            console.log('error', error);
            throw error;
        }
    }
}
