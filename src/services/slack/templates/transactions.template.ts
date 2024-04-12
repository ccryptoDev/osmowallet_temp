import { FundingMethodEnum } from "src/modules/funding/enums/fundingMethod.enum"
import { CoinEnum } from "src/modules/me/enums/coin.enum"
import { WithdrawalMethodEnum } from "src/modules/withdraw/enums/withdrawalMethod.enum"
import { SlackChannel } from "../enums/slack-channels.enum"
import { SlackEmoji } from "../enums/slack-emoji.enum"

type TransactionsTemplateParams = {
    channel: SlackChannel
    amount: number,
    coin: CoinEnum,
    firstName: string,
    lastName: string,
    email: string,
    transactionType: {
        name: FundingMethodEnum | WithdrawalMethodEnum
        emoji: SlackEmoji
		type?: string
    }
    attachmentUrl: string,
}
export const createTransactionsTemplate = ({ amount, coin, firstName, lastName, email, transactionType, attachmentUrl }: TransactionsTemplateParams) => {
	const [date, hours] = getDateAndHour()
	
	return {
		// "channel": channel,
		"blocks": [
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": `${transactionType.emoji} *TRANSACTION DETAILS* ${transactionType.emoji}`
					
				}
			},
			{
				"type": "divider"
			},
			{
				"type": "section",
				"fields": [
					{
						"type": "mrkdwn",
						"text": `*Amount:*\n ${getCoinSymbol(coin)}${Number(amount).toLocaleString("en", {maximumFractionDigits: 2, minimumFractionDigits: 2})}`
					},
					{
						"type": "mrkdwn",
						"text": `*Transaction Type:*\n ${transactionType.name} _*${transactionType?.type}*_`

					},
					{
						"type": "mrkdwn",
						"text": `*Date:*\n${date}`
					},
					{
						"type": "mrkdwn",
						"text": `*Full Name:*\n ${firstName.charAt(0).toUpperCase() + firstName.slice(1)} ${lastName.charAt(0).toUpperCase() + lastName.slice(1)}`
					},
					{
						"type": "mrkdwn",
						"text": `*Time:*\n${hours}`
					},
					{
						"type": "mrkdwn",
						"text": `*Email:*\n ${email}`
					}
				]
			},
			{
				"type": "divider"
			},
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": ":paperclip: *Attachment:*"
				},
				"accessory": {
					"type": "button",
					"text": {
						"type": "plain_text",
						"text": "View Attachment"
					},
					"url": attachmentUrl
				}
			}
		]
	}
}

export type TransactionsTemplate = ReturnType<typeof createTransactionsTemplate>

function getCoinSymbol(coin: CoinEnum) {
    switch (coin) {
        case CoinEnum.GTQ:
            return "Q"
        case CoinEnum.USD:
            return "$"
        default:
            return coin + " "
    }
}





function getDateAndHour() {
    const date = new Intl.DateTimeFormat('es-ES', {
        hourCycle: "h12",
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Guatemala"
    }).format(new Date());
    return date.split(",");
	
}