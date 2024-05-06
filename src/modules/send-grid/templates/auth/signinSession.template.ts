import { EmailAttachmentStructure, EmailContentStructure, EmailFromStructure, EmailToStructure, SendgridTemplate } from "../sendgridBase.template";

/*
    This class send email verification to the user extending of base class
 */
    export class SigninSessionTemplate extends SendgridTemplate{

        /// The link is where the user will be redirected after click the button in the email
        link: string = ''
    
        /// This template in html format will be displayed in the email
        template: string = "<html>"+
                    "<body style='"+
                    "background-image: url('https://upload."+
                "wikimedia.org/wikipedia/commons/thumb/f/ff/"+
                "Solid_blue.svg/768px-Solid_blue.svg.png?20150316143734');"+
                "background-position: center center;"+
                "background-repeat: no-repeat;"+
                "background-attachment: fixed;"+
                "background-size: cover;"+
                "background-color: 'black';"+
                "'>"+
                "<div style='background-color: white; opacity: 0.8;'>"+
                "<img style='height: 150px; display:block; margin: auto;'"+
                "src='https://firebasestorage.googleapis.com/v0/b/osmowallet.appspot.com/o/logo_horizontal.png?alt=media&token=a5c62c30-3949-42f1-87b0-6a685ba29cfe&_gl=1*cwq17r*_ga*ODMwNzgzNzUxLjE2ODQ4NTIwMTc.*_ga_CW55HF8NVT*MTY5ODc2NDUyNC4zMDMuMS4xNjk4NzY0NTU5LjI1LjAuMA'>"+
                "</div>"+
                "<div style='height: auto; background-color: white; opacity: 0.5;'>"+
                "<div style='padding: 20px;'>"+
                "<p style='color: black;font-size: 30px;font-family: 'Helvetica';'>"+
                "¡Hola!"+
                "</p>"+
                "<p style='color: black;font-size: 20px;font-family: 'Helvetica';'>"+
                "Hemos detectado un nuevo inicio de sesión en tu cuenta Osmo el dia ***date***:"+
                "</p>"+
                "<p style='color: black;font-size: 20px;font-family: 'Helvetica';'>"+
                "- IP: <strong>***ip***</strong><br>"+
                "- Dispositivo: <strong>***deviceName***</strong><br>"+
                "- Ubicación*: <strong>***location***</strong><br>"+
                "</p>"+
                "<p style='color: black;font-size: 15px;font-family: 'Helvetica';'>"+
                "*La ubicación es aproximada según la dirección"+
                " IP de inicio de sesión."+
                "</p>"+
                "<p style='color: black;font-size: 20px;font-family: 'Helvetica';'>"+
                "En caso de tener inconvenientes, puedes contactar al "+
                "<a href='https://osmowallet.com'>centro de ayuda</a>."+
                "</p>"+
                "</div>"+
                "<div>"+
                "</div>"+
            "</div>"+
            "</body>"+
            "</html>";
        constructor(
            to: Array<EmailToStructure>,
            token: string,
            username: string,
            ip: string,
            deviceName: string,
            location: string,
            attachments?: Array<EmailAttachmentStructure>,
            ){
            super(to,attachments)
            this.template = this.template.replace('***date***',(new Date()).toDateString())
            this.link = `https://${process.env.DOMAIN}/?token=`+token
            this.template = this.template.replace('***link***',this.link)
            this.template = this.template.replace('***ip***',ip)
            this.template = this.template.replace('***deviceName***',deviceName)
            this.template = this.template.replace('***location***',location)
            const emailContent = new EmailContentStructure()
            this.subject = 'Nueva sesión registrada'
            emailContent.value = this.template
            this.content = [emailContent]
        }
    }