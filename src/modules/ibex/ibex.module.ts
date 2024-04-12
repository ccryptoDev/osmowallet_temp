import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import EncrypterHelper from 'src/common/helpers/encrypter.helper';
import { IbexToken } from 'src/entities/ibexToken.entity';
import { IbexService } from './ibex.service';
import { IbexController } from './ibex.controller';
import { Address } from 'src/entities/address.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { UsersModule } from '../users/users.module';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { UsernameMsService } from '../username-ms/username-ms.service';
import { RedisService } from 'src/common/services/redis/redis.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Addresses, AddressesSchema } from 'src/schemas/addresses.schema';
import { Coin } from 'src/entities/coin.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            IbexToken,
            Address,
            IbexAccount,
            Coin
        ]),
        MongooseModule.forFeature([
            { name: Addresses.name, schema: AddressesSchema }
        ]),
        UsersModule,
    ],
    exports: [IbexService],
    providers: [IbexService, EncrypterHelper, GoogleCloudTasksService, UsernameMsService, RedisService],
    controllers: [IbexController],
})
export class IbexModule { }
