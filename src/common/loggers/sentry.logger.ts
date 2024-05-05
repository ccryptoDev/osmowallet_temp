import { Inject } from "@nestjs/common";
import { SendGridService } from "src/modules/send-grid/send-grid.service";
import { AbstractLoggerHandler } from "./handler.logger";
import { SystemErrorTemplate } from "src/modules/send-grid/templates/systemError.template";
import * as Sentry from "@sentry/node";
import { LoggerData } from "./interface.logger";

export class SentryLogger extends AbstractLoggerHandler {
    

    public handle(message: string,error: LoggerData): void {
        // Sentry.captureException(message, {
        //     level: 'error',
        //     user: {
        //         email: error.email,
        //         ip_address: error.ip,
        //     },
        //     extra: {
        //         message: message,
        //         trace: error.trace,
        //         agent: error.agent,
        //         path: error.path,
        //         ip: error.ip
        //     }
        // });
        super.handle(message, error);
    }
}