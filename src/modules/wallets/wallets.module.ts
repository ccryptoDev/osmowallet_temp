import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from 'src/entities/wallet.entity';
import { CoinsModule } from '../coins/coins.module';
import { WalletsController } from './wallets.controller';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { cryptomate_account, cryptomate_accountSchema } from 'src/schemas/account.schema';
import { MongoWallet, MongoWalletSchema } from 'src/schemas/wallets.schema';

@Module({
    imports: [
        TypeOrmModule.forFeature([Wallet]),
        MongooseModule.forFeature([
            { name: cryptomate_account.name, schema: cryptomate_accountSchema },
            { name: MongoWallet.name, schema: MongoWalletSchema },
        ]),
        CoinsModule, 
        HttpModule
    ],
    providers: [WalletsService],
    exports: [WalletsService],
    controllers: [WalletsController],
})
export class WalletsModule { }
