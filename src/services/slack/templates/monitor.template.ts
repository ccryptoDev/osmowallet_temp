import { SlackSectionType } from "../enums/slackSectionType.enum"


export class SlackNotification {
   service: string

   sections: SlackMessage[]
}

abstract class SlackMessage{}



export class SlackTextSection extends SlackMessage {
 type: SlackSectionType = SlackSectionType.SECTION
 text: SlackSectionBody
}

export interface SlackMessageSection extends SlackMessage {
 type: SlackSectionType
 fields: SlackSectionBody[]
}

export interface SlackSectionBody {
   type: SlackSectionType,
   text: string,
}

