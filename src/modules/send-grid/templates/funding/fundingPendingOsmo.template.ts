import { User } from "src/entities/user.entity";
import { EmailAttachmentStructure, EmailContentStructure, EmailFromStructure, EmailToStructure, SendgridTemplate } from "../sendgridBase.template";
import { FundingDataEmail } from "./data";




/*
    This class send email transaction funding in Pending to the user extending of base class
 */
export class FundingPendingOsmoTemplate extends SendgridTemplate{

    /// This template in html format will be displayed in the email
    template: string = `
            <html>
        <head>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@500;700&display=swap" rel="stylesheet">
            <style>
                body {
                font-family: 'Noto Sans', Arial, Verdana, Georgia, 'Times New Roman', Courier, sans-serif;
                margin: 0;
                }

                .logo {
                    text-align: center;
                }

                .logo img {
                width: 100%;
                }

                .verifica {
                    margin-left: 5%;
                    margin-right: 5%;
                    text-align: center;
                }

                .bienvenido {
                    margin-left: 10%;
                    margin-right: 10%;
                    text-align: center;
                }

                .duda {
                    margin-left: 5%;
                    margin-right: 5%;
                    text-align: left;
                }

                .icon {
                    text-align: center;
                    width: 425px;
                    height: 101px;
                }

                .button {
                    margin-left: 10%;
                    margin-right: 10%;
                    text-align: center;
                }

                .sized-box {
                    height: 20px;
                }

                .a-no-underline {
                    text-decoration: none;
                }

                .paragraph {
                font-size: 20px;
                color: #474747;
                }

                .deposit-amount {
                font-size: 64px;
                font-weight: 700;
                color: #202020;
                text-align: center;
                display: block;
                }

                .link {
                display: inline-block;
                }

                .link div {
                width: 240px;
                background-color: #0151FE;
                color: #fff;
                text-align: center;
                font-weight: 700;
                font-size: 20px;
                padding: 12px;
                border-radius: 20px;
                }

                .center-content {
                margin: 0 auto;
                text-align: center;
                }

                .divider {
                border: 1px solid #D2D3D4;
                }

                .card {
                box-shadow: 0px 0px 6px 1px rgba(0, 0, 0, 0.05);
                border-radius: 12px;
                padding: 24px;
                margin: 0 16px;
                }

                .table {
                width: 100%;
                table-layout: fixed;
                }

                .table tr td {
                font-size: 20px;
                }
                .table tr td:first-child {
                color: #949494;
                }

                .table tr td:first-child.status-pending,
                .status-pending {
                color: #F4D32B;
                }

                footer {
                margin: 0 16px;
                }
            </style>
        </head>

        <body style="background-color: #fff !important;">
            <div class="logo">
            <img
            src="https://firebasestorage.googleapis.com/v0/b/osmowallet.appspot.com/o/logo_horizontal.png?alt=media&token=a5c62c30-3949-42f1-87b0-6a685ba29cfe&_gl=1*cwq17r*_ga*ODMwNzgzNzUxLjE2ODQ4NTIwMTc.*_ga_CW55HF8NVT*MTY5ODc2NDUyNC4zMDMuMS4xNjk4NzY0NTU5LjI1LjAuMA" />
            </div>
            <div class="sized-box"></div>
            <div class="sized-box"></div>
            
            <div class="center-content">
            <img src="https://firebasestorage.googleapis.com/v0/b/osmowallet.appspot.com/o/DepositEmailNotifications%2Fpending.png?alt=media&token=3dc461d5-3986-4618-914b-4d32d623c1f1" alt="success shield">
            </div>
            
            <div class="sized-box"></div>
            
            <p class="paragraph center-content">
            ¡Hola equipo Osmo! <br>
            Se recibió un depósito pendiente de un usuario Osmo <br>
            </p>

            <div class="sized-box"></div>

            <span class="deposit-amount">
            ${ this.fundingDataEmail.amount } ${ this.fundingDataEmail.currency }
            </span>

            <div class="sized-box"></div>
            <div class="sized-box"></div>
            <span class="deposit-amount">
            ${ process.env.ENV == 'DEV' ? 'Development mode' : '' }
            </span>
            <div class="center-content">
            </div>
            <div class="sized-box"></div>
            <div class="sized-box"></div>
            
            <div class="divider"></div>

            <div class="sized-box"></div>
            <div class="sized-box"></div>

            <div class="card">
            <table class="table">
                <tbody>
                <tr>
                    <td>
                    Usuario:
                    </td>
                    <td>
                    ${ this.clientName }
                    </td>
                </tr>
                <tr>
                    <td>
                    Email:
                    </td>
                    <td>
                    ${ this.clientEmail }
                    </td>
                </tr>
                <tr>
                    <td>
                    Monto:
                    </td>
                    <td>
                    ${ this.fundingDataEmail.amount } ${ this.fundingDataEmail.currency }
                    </td>
                </tr>
                <tr>
                    <td>
                    ID de transacción:
                    </td>
                    <td>
                    ${ this.fundingDataEmail.transactionId }
                    </td>
                </tr>
                <tr>
                    <td>
                    Fecha:
                    </td>
                    <td>
                    ${ this.fundingDataEmail.date }
                    </td>
                </tr>
                <tr>
                    <td class="status-pending">
                    Estado:
                    </td>
                    <td class="status-pending">
                    ${ this.fundingDataEmail.status }
                    </td>
                </tr>
                </tbody>
            </table>
            </div>

            <div class="sized-box"></div>
            <div class="sized-box"></div>

        </body>

        </html>
    `;
    constructor(
        to: Array<EmailToStructure>,
        private clientName: string,
        private clientEmail: string,
        private fundingDataEmail: FundingDataEmail,
        attachments?: Array<EmailAttachmentStructure>,
        ){
        super(to,attachments)
        const emailContent = new EmailContentStructure()
        this.from = new EmailFromStructure()
        this.subject = `Depósito por ${this.fundingDataEmail.amount} ${this.fundingDataEmail.currency} a sido solicitado ${(new Date()).toISOString()}`
        emailContent.value = this.template
        this.content = [emailContent]        
    }
}