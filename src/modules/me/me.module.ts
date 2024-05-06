import {  Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Autoconvert } from 'src/entities/autoconvert.entity';
import { BankAccount } from 'src/entities/bank.account.entity';
import { Bank } from 'src/entities/bank.entity';
import { Coin } from 'src/entities/coin.entity';
import { Period } from 'src/entities/period.entity';
import { Preference } from 'src/entities/preference.entity';
import { RecentContact } from 'src/entities/recent.contact.entity';
import { User } from 'src/entities/user.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { MeController } from './me.controller';
import { MeService } from './me.service';
import { GoogleCloudStorageService } from '../../services/google-cloud-storage/google-cloud-storage.service';
import { AccountDeletion } from 'src/entities/account.deletion.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { UsernameMsService } from '../username-ms/username-ms.service';
import { WalletsModule } from '../wallets/wallets.module';
import { UsersModule } from '../users/users.module';
import { UserReferralSource } from 'src/entities/user.referral.source.entity';
import { ReferralSource } from 'src/entities/referral.source.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
    User,
    BankAccount,
    Coin,
    Bank,
    Preference,
    Wallet,
    Period,
    RecentContact,
    Autoconvert,
    AccountDeletion,
    IbexAccount,
    UserReferralSource,
    ReferralSource
  ]),
  WalletsModule,
  UsersModule
],
  controllers: [MeController],
  providers: [MeService,GoogleCloudStorageService,UsernameMsService],
  exports: [MeService]

})
export class MeModule{}
