import { ConsoleLogger } from '@nestjs/common';
import { LoggerData } from './interface.logger';

interface LoggerHandler {
    setNext(handler: LoggerHandler): LoggerHandler;
    handle(message: string, error: LoggerData): void;
}

export abstract class AbstractLoggerHandler extends ConsoleLogger implements LoggerHandler {
    private nextHandler!: LoggerHandler;

    public setNext(handler: LoggerHandler): LoggerHandler {
        this.nextHandler = handler;
        return handler;
    }

    public handle(message: string, error: LoggerData): void {
        if (this.nextHandler) {
            this.nextHandler.handle(message, error);
        }
    }
}
