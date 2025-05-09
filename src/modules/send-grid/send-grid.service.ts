import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as client from '@sendgrid/mail';
import * as Sentry from '@sentry/node';
import { SendgridTemplate } from 'src/modules/send-grid/templates/sendgridBase.template';
import { SlackChannel } from 'src/services/slack/enums/slack-channels.enum';
import { SlackService } from 'src/services/slack/slack.service';
import { createErrorTemplate } from 'src/services/slack/templates/errorMonitor.template';

@Injectable()
export class SendGridService {
    constructor(private configService: ConfigService) {
        const sendGridApiKey = this.configService.getOrThrow('SENDGRID_API_KEY');
        client.setApiKey(sendGridApiKey);
    }

    async sendMail(template: SendgridTemplate) {
        client
            .send(JSON.parse(JSON.stringify(template)))
            .then(() => console.log('ACTION: Send email, STATUS: SUCCESS'))
            .catch(async (error) => {
                Sentry.captureException(error, {
                    extra: {
                        email: template.to[0]?.email,
                    },
                });
                SlackService.errorTransaction(
                    createErrorTemplate({
                        message: error.message,
                        channel: SlackChannel.OSMO_STATUS_MONITOR,
                        route: 'SendGridService',
                        trace: error.stack,
                        userEmail: template.to[0]?.email ?? 'No email provided',
                    }),
                );
            });
    }
}
