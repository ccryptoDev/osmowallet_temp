
export class EmailFromStructure{
    // The sender email
    email: string = 'ayuda@osmowallet.com'

    // The main name of the email example 'Verification'
    name: string = 'OsmoWallet'
}

export class EmailContentStructure{
    type: string = 'text/html'
    value: string = ''
}

export class EmailToStructure{
    email: string
    name: string = ''
}

export class EmailAttachmentStructure{
    content: string
    filename: string
    type?: string = 'text/plain'
    disposition?: string = 'attachment'
}

///This is the base class to send email using Sendgrid Third Party service
export abstract class SendgridTemplate{

    from: EmailFromStructure = new EmailFromStructure()

    ///The "to" variable is a list of receivers 
    to: Array<EmailToStructure>

    /// We can attach some files if you want, so it´s optional
    attachments?: Array<EmailAttachmentStructure>

    /// The topic of the email
    subject: string

    // The content of the email
    content: Array<EmailContentStructure>
    constructor(
        to: Array<EmailToStructure>,
        attachments?: Array<EmailAttachmentStructure>,
    ){
        this.to = to
        this.attachments = attachments
    }
}



