import { EmailAttachmentStructure, EmailContentStructure, EmailToStructure, SendgridTemplate } from '../sendgridBase.template';

/*
    This class send email verification to the user extending of base class
 */
export class MonthlyReportTemplate extends SendgridTemplate {
    /// The link is where the user will be redirected after click the button in the email
    link: string = '';

    /// This template in html format will be displayed in the email
    template: string = `
                <html>
                <body style='
                background-position: center center;
                background-repeat: no-repeat;
                background-attachment: fixed;
                background-size: cover;
                background-color: 'black';'>
                <div style='background-color: white; opacity: 0.8;'>
                <img style='height: 150px; display:block; margin: auto;'
                src='https://firebasestorage.googleapis.com/v0/b/osmowallet.appspot.com/o/logo_horizontal.png?alt=media&token=a5c62c30-3949-42f1-87b0-6a685ba29cfe&_gl=1*cwq17r*_ga*ODMwNzgzNzUxLjE2ODQ4NTIwMTc.*_ga_CW55HF8NVT*MTY5ODc2NDUyNC4zMDMuMS4xNjk4NzY0NTU5LjI1LjAuMA'>
                </div>
                <div style='height: auto; background-color: white;'>
                <div style='padding: 20px;'>
                <p style='color: black;font-size: 30px;font-family: 'Helvetica';'>
                </p>
                <p style='color: black;font-size: 20px;font-family: 'Helvetica';'>
                <strong>Hey Vic, en el archivo adjunto estan los reportes mensuales:<strong/>
                </p>
                <p style='color: black;font-size: 20px;font-family: 'Helvetica';'>
                </p>
                </div>
                <div>
                </div>
                </div>
                </body>
                </html>
    `;
    constructor(to: Array<EmailToStructure>, attachments?: Array<EmailAttachmentStructure>) {
        super(to, attachments);
        const emailContent = new EmailContentStructure();
        this.subject = 'Monthly report';
        emailContent.value = this.template;
        this.content = [emailContent];
    }
}
