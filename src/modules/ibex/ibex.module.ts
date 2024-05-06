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

@Module({
    imports: [
        TypeOrmModule.forFeature([
            IbexToken,
            Address,
            IbexAccount
        ]),
        UsersModule,
    ],
    exports: [IbexService],
    providers: [IbexService,EncrypterHelper,GoogleCloudTasksService,UsernameMsService,RedisService],
    controllers: [IbexController],
})
export class IbexModule {}
