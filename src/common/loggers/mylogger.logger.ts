import { AbstractLoggerHandler } from './handler.logger';
import { LoggerData } from './interface.logger';

export class MyLogger extends AbstractLoggerHandler {
    public logError(message: string, error: LoggerData) {
        if (error.trace) {
            delete error.trace;
        }
        const result = `Logging HTTP request ${JSON.stringify(error)}`;
        super.error(result);
        this.handle(message, error);
    }

    public handle(message: string, error: LoggerData): void {
        super.handle(message, error);
    }
}
