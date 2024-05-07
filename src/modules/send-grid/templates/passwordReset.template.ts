import {
    EmailAttachmentStructure,
    EmailContentStructure,
    EmailFromStructure,
    EmailToStructure,
    SendgridTemplate,
} from './sendgridBase.template';

/*
    This class send email verification to the user extending of base class
 */
export class PasswordResetTemplate extends SendgridTemplate {
    /// The link is where the user will be redirected after click the button in the email
    private link: string = '';

    /// This template in html format will be displayed in the email
    template: string = `
                <html>
                    <body style='background-image: url('https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Solid_blue.svg/768px-Solid_blue.svg.png?20150316143734');
                background-position: center center;
                background-repeat: no-repeat;
                background-attachment: fixed;
                background-size: cover;
                background-color: 'black';'>
                <div style='background-color: white; opacity: 0.8;'>
                <img style='height: 150px; display:block; margin: auto;'
                src='https://uploads-ssl.webflow.com/61e999714a6eef5daffa5d8d/61e99dc40019b37aae9107c0_LOGOTIPO_OSMO_V_HORIZONTAL.png'>
                </div>
                <div style='height: auto; background-color: white; opacity: 0.5;'>
                <div style='padding: 20px;'>
                <p style='color: black;font-size: 30px;font-family: 'Helvetica';'>
                ¡Hola, <b>${this.username}</b>!
                </p>
                <p style='color: black;font-size: 20px;font-family: 'Helvetica';'>
                Restablece tu contraseña: <a href='***link***'>Aquí</a>
                </p>
                <p style='color: black;font-size: 20px;font-family: 'Helvetica';'>
                En caso de tener inconvenientes, puedes contactar al <a href='https://osmowallet.com'>centro de ayuda</a>.
                </p>
                </div>
                <div>
                </div>
                </div>
                </body>
                </html>
    `;
    constructor(
        to: Array<EmailToStructure>,
        token: string,
        private username: string,
        attachments?: Array<EmailAttachmentStructure>,
    ) {
        super(to, attachments);
        this.username = username;
        const emailContent = new EmailContentStructure();
        const fromContent = new EmailFromStructure();
        this.from = fromContent;
        this.link = `https://${process.env.APP_SUBDOMAIN}.osmowallet.com/password-reset/?token=${token}`;
        this.template = this.template.replace('***link***', this.link);
        this.subject = 'Restablecimiento de contraseña';
        emailContent.value = this.template;
        this.content = [emailContent];
    }
}
