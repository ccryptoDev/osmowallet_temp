import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { SlackWebhooks } from './enums/slack-webhooks.enum';
import { ErrorTemplate } from './templates/errorMonitor.template';
import { TransactionsTemplate } from './templates/transactions.template';
import { StillmanTemplate } from './templates/stillman.template';

@Injectable()
export class SlackService {
    static async notifyTransaction({ baseURL, data }: { baseURL: SlackWebhooks; data: TransactionsTemplate }) {
        if (process.env.ENV === 'DEV') axios({ method: 'POST', baseURL, data }).catch((err) => console.log(err));
    }

    static async errorTransaction(data: ErrorTemplate) {
        axios({ method: 'POST', baseURL: process.env.SLACK_WEBHOOK_URL, data }).catch((err) => console.log(err));
    }

    static async stillmanTransaction({ baseURL, data }: { baseURL: SlackWebhooks; data: StillmanTemplate }) {
        axios({ method: 'POST', baseURL, data }).catch((err) => console.log(err));
    }
}
