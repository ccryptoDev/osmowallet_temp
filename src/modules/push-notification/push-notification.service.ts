import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as Sentry from "@sentry/node";
import admin from 'firebase-admin';
import { PushToken } from 'src/entities/push.token.entity';
import { User } from 'src/entities/user.entity';
import { Verification } from 'src/entities/verification.entity';
import { Repository } from 'typeorm';
import { PushPayload } from './interfaces/payload.interface';
import { SlackService } from 'src/services/slack/slack.service';
import { createErrorTemplate } from 'src/services/slack/templates/errorMonitor.template';
import { SlackChannel } from 'src/services/slack/enums/slack-channels.enum';

@Injectable()
export class PushNotificationService {
    private readonly logger = new Logger(PushNotificationService.name);

    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Verification) private verificationRepository: Repository<Verification>,
        @InjectRepository(PushToken) private pushTokenRepository: Repository<PushToken>,
    ) { }


    async sendPushToUser(user: User, payload: PushPayload) {
        const latestTokenRecord = await this.pushTokenRepository.createQueryBuilder('pushToken')
        .leftJoinAndSelect('pushToken.user', 'user')
        .where('user.id = :userId', { userId: user.id })
        .orderBy('pushToken.createdAt', 'DESC')
        .select(['pushToken.token'])
        .getOne();
        if(latestTokenRecord){
            this.sendPushNotification([latestTokenRecord.token], payload);
        }

    }

    private async sendPushNotification(tokens: Array<string>, payload: PushPayload) {
        admin.messaging().sendEachForMulticast({
            tokens: tokens,
            data: payload.data ? JSON.parse(JSON.stringify(payload.data)) : null,
            notification: {
                body: payload.message,
                title: payload.title,
            }
        })
        .then(() => {
            this.logger.log('ACTION: Send Push Notification, STATUS: SUCCESS')
        })
        .catch((error) => {
            Sentry.captureException(error)
            SlackService.errorTransaction(
                createErrorTemplate({
                    message: error.message,
                    channel: SlackChannel.OSMO_STATUS_MONITOR,
                    route: payload.data.route,
                    trace: error.stack,
                    userEmail: "N/A",
                })
            )
        });
    }

}
