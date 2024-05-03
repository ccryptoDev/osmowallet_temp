import { Module, Scope } from '@nestjs/common';
import { RidiviService } from './ridivi.service';
import { MongooseModule } from '@nestjs/mongoose';
import { RidiviAccount, RidiviAccountSchema } from 'src/schemas/solfinAccount.schema';
import { KycModule } from 'src/modules/kyc/kyc.module';
import { UsersModule } from 'src/modules/users/users.module';
import { Country, CountrySchema } from 'src/schemas/countries.schema';
import { RidiviController } from './ridivi.controller';
import { GoogleCloudTasksService } from '../google-cloud-tasks/google-cloud-tasks.service';
import { ConfigModule } from '@nestjs/config';
import { PushNotificationModule } from 'src/modules/push-notification/push-notification.module';
import { EntityManager } from 'typeorm';

@Module({
    imports: [
        ConfigModule,
        MongooseModule.forFeature([
            { name: RidiviAccount.name, schema: RidiviAccountSchema },
            { name: Country.name, schema: CountrySchema },
        ]),
        UsersModule,
        KycModule,
        PushNotificationModule,
    ],
    providers: [
        RidiviService,
        GoogleCloudTasksService,
        {
            provide: 'REQUEST_SCOPED_ENTITY_MANAGER',
            scope: Scope.REQUEST,
            useFactory: (manager: EntityManager) => manager,
            inject: [EntityManager],
        },
    ],
    controllers: [RidiviController],
    exports: [RidiviService],
})
export class RidiviModule {}
