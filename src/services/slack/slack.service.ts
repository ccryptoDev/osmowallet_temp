import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { SlackSectionType } from './enums/slackSectionType.enum';
import { SlackNotification, SlackTextSection } from './templates/monitor.template';
import { ErrorTemplate } from './templates/errorMonitor.template';
import { TransactionsTemplate } from './templates/transactions.template';
import { SlackWebhooks } from './enums/slack-webhooks.enum';
export { SlackNotification, SlackSectionType, SlackTextSection };

@Injectable()
export class SlackService {
    static async notifyTransaction({ baseURL, data }: { baseURL: SlackWebhooks, data: TransactionsTemplate }) {
        if (process.env.ENV === "PROD")
            axios({ method: 'POST', baseURL: baseURL, data }).catch(err => console.log(err))
    }


    static async errorTransaction(data: ErrorTemplate) {
        axios({ method: 'POST', baseURL: process.env.SLACK_WEBHOOK_URL, data }).catch(err => console.log(err))
    }
}
