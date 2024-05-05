import { Inject } from "@nestjs/common";
import { SendGridService } from "src/modules/send-grid/send-grid.service";
import { AbstractLoggerHandler } from "./handler.logger";
import { SystemErrorTemplate } from "src/modules/send-grid/templates/systemError.template";
import { IbexServiceException } from "../exceptions/ibex.exception";
import { LoggerData } from "./interface.logger";

export class EmailLogger extends AbstractLoggerHandler {
    constructor(@Inject(SendGridService) private sendgridService: SendGridService) {
        super();
    }

    public handle(message: string, error: LoggerData): void {
        if(error.error instanceof IbexServiceException){
            const template = new SystemErrorTemplate(
                [{email: 'as@singularagency.co',name: 'amilkar'}],
                message
            )
            this.sendgridService.sendMail(template);
        }
        
        super.handle(message, error);
    }
}