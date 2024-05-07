import { intlFormat } from 'date-fns';
import { SlackChannel } from '../enums/slack-channels.enum';

type ErrorTemplateParams = {
    channel: SlackChannel;
    userEmail: string;
    route: string;
    message: string;
    trace: any;
};

export const createErrorTemplate = ({ userEmail, route, message, trace }: ErrorTemplateParams) => {
    const [date, hours] = getDateAndHour();
    return {
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: ':warning: *Error Notification* :warning:',
                },
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Time:*\n${date} ${hours}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*User Email:*\n${userEmail}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Error Message:*\n${message}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Route:*\n${route}`,
                    },
                ],
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: '*Trace:*\n```\n' + trace + '\n```',
                },
            },
        ],
    };
};

export type ErrorTemplate = ReturnType<typeof createErrorTemplate>;

function getDateAndHour() {
    const date = intlFormat(
        new Date(),
        { hour12: true, dateStyle: 'short', timeZone: 'America/Guatemala', timeStyle: 'short' },
        { locale: 'en-GB' },
    );
    return date.split(',');
}
