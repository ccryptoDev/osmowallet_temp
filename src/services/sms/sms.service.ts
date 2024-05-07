import { Injectable } from '@nestjs/common';
import * as twilio from 'twilio';
import { AuthPayload } from './payloads/auth.payload';
import { ReferralInvitationPayload } from './payloads/referral.payload';
import { WhatsappTemplate } from './templates/whatsapp.template';

@Injectable()
export class SmsService {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    async sendAuthMessage(payload: AuthPayload) {
        this.client.messages.create({
            contentSid: WhatsappTemplate.AUTH,
            to: `whatsapp:${payload.phoneNumber}`,
            from: `whatsapp:${process.env.TWILIO_PHONE}`,
            messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_ID,
            contentVariables: JSON.stringify({
                1: payload.code
            })
        })
    }

    async sendFiatInvitation(payload: ReferralInvitationPayload) {
        this.client.messages.create({
            contentSid: WhatsappTemplate.FIAT_OVER_SMS,
            to: `whatsapp:${payload.phoneNumber}`,
            from: `whatsapp:${process.env.TWILIO_PHONE}`,
            messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_ID,
            contentVariables: JSON.stringify({
                1: payload.amount.toString(),
                2: payload.currency,
                3: payload.from
            })
        })
    }
}
