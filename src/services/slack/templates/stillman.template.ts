import { SlackEmoji } from '../enums/slack-emoji.enum';

type SendStillmanParams = {
    reservesAmount: number;
    amount: number;
    callType: 'Sell' | 'Buy';
};

export const stillmanTemplate = ({ reservesAmount, amount, callType }: SendStillmanParams) => {
    return {
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: ':moneybag: *Stillman Liquidity Service Alert* :moneybag:',
                },
            },
            {
                type: 'divider',
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*${callType} Call* ${callType === 'Sell' ? SlackEmoji.ARROW_DOWN : SlackEmoji.ARROW_UP}`,
                },
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Amount ${callType === 'Sell' ? 'sent' : 'requested'}:* $${amount}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Date and Time:*\n ${new Date().toISOString()}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Reserves Amount:* $${reservesAmount}`,
                    },
                ],
            },
        ],
    };
};

export type StillmanTemplate = ReturnType<typeof stillmanTemplate>;
