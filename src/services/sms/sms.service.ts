import { Injectable } from '@nestjs/common';
import * as twilio from 'twilio';
import * as Sentry from '@sentry/node';

export class SMSPayload {
    phoneNumber!: string;
    message!: string;
}

@Injectable()
export class SmsService {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    async sendSMS(payload: SMSPayload) {
        this.client.messages
            .create({
                body: payload.message,
                to: payload.phoneNumber,
                from: process.env.TWILIO_PHONE,
            })
            .catch((e) =>
                Sentry.captureException(e, {
                    extra: {
                        phone: payload.phoneNumber,
                    },
                }),
            );
    }
}
