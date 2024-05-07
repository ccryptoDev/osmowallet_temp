import { SlackEmoji } from '../enums/slack-emoji.enum';

type SendStillmanParams = {
    reservesAmount: number;
    requeredBalance: number;
    treasuresAmount: number;
    callType: 'Sell' | 'Buy';
};

export const stillmanTemplate = ({ reservesAmount, treasuresAmount, requeredBalance, callType }: SendStillmanParams) => {
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
                        text: `*Amount ${callType === 'Sell' ? 'sent' : 'requested'}:* SAT  ${requeredBalance}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Date and Time:*\n ${new Date().toISOString()}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Treasures Amount:* SAT ${treasuresAmount}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Reserves Amount:* SAT ${reservesAmount}`,
                    },
                ],
            },
        ],
    };
};

export type StillmanTemplate = ReturnType<typeof stillmanTemplate>;
