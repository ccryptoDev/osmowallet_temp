import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from 'src/entities/wallet.entity';
import { CoinsModule } from '../coins/coins.module';
import { WalletsController } from './wallets.controller';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { cryptomateAccount, cryptomateAccountSchema } from 'src/schemas/account.schema';
import { cryptomateWallet, cryptomateWalletSchema } from 'src/schemas/wallets.schema';

@Module({
    imports: [
        TypeOrmModule.forFeature([Wallet]),
        MongooseModule.forFeature([
            { name: cryptomateAccount.name, schema: cryptomateAccountSchema },
            { name: cryptomateWallet.name, schema: cryptomateWalletSchema },
        ]),
        CoinsModule, 
        HttpModule
    ],
    providers: [WalletsService],
    exports: [WalletsService],
    controllers: [WalletsController],
})
export class WalletsModule { }
