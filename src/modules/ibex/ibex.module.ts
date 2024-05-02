import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import EncrypterHelper from 'src/common/helpers/encrypter.helper';
import { RedisService } from 'src/common/services/redis/redis.service';
import { Address } from 'src/entities/address.entity';
import { Coin } from 'src/entities/coin.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { IbexToken } from 'src/entities/ibexToken.entity';
import { Addresses, AddressesSchema } from 'src/schemas/addresses.schema';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { UsernameMsService } from '../username-ms/username-ms.service';
import { UsersModule } from '../users/users.module';
import { IbexController } from './ibex.controller';
import { IbexService } from './ibex.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([IbexToken, Address, IbexAccount, Coin]),
        MongooseModule.forFeature([{ name: Addresses.name, schema: AddressesSchema }]),
        UsersModule,
    ],
    exports: [IbexService],
    providers: [IbexService, EncrypterHelper, GoogleCloudTasksService, UsernameMsService, RedisService],
    controllers: [IbexController],
})
export class IbexModule {}
