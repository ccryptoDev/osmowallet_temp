import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushToken } from 'src/entities/push.token.entity';
import { User } from 'src/entities/user.entity';
import { Verification } from 'src/entities/verification.entity';
import { PushNotificationService } from './push-notification.service';

@Module({
    imports: [TypeOrmModule.forFeature([User, Verification, PushToken])],
    providers: [PushNotificationService],
    exports: [PushNotificationService],
})
export class PushNotificationModule {}
