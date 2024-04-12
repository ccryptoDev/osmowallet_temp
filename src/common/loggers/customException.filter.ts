import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { SlackChannel } from 'src/services/slack/enums/slack-channels.enum';
import { SlackService } from "src/services/slack/slack.service";
import { createErrorTemplate } from 'src/services/slack/templates/errorMonitor.template';
import { EmailLogger } from './email.logger';
import { LoggerData } from './interface.logger';
import { MyLogger } from './mylogger.logger';
import { SentryLogger } from './sentry.logger';

@Injectable()
@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  blacklistRoutes = {
    '/auth/pin': true,
    '/auth/input/verify': true,
    '/auth/session': true,
    '/auth/signup': true,
    '/auth/pin/verify': true,
    '/auth/refresh-token': true,
  }

  constructor(
    private logger: MyLogger,
    private emailLogger: EmailLogger,
    private sentryLogger: SentryLogger,
  ) {
    this.logger.setNext(this.emailLogger).setNext(this.sentryLogger);
  }

  catch(error: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const user = request.user; // Retrieve the user payload from the request object
    let email = ''
    let userId = ''
    if (user != undefined) {
      userId = user['sub']
      email = user['email']
    }
    const trace = error.stack ?? '';
    const data: LoggerData = {
      userId: userId,
      email: email,
      agent: request.headers['user-agent'],
      ip: request.headers['x-forwarded-for'],
      path: request.url,
      error: error.message,
      trace: trace
    };

    if (this.blacklistRoutes[request.url] === undefined || !(error instanceof UnauthorizedException)) 
      SlackService.errorTransaction(createErrorTemplate({
        channel: SlackChannel.OSMO_STATUS_MONITOR,
        userEmail: email,
        route: request.url,
        message: error.message,
        trace: trace
      }))


    this.logger.logError(error.message, data);
    if (error instanceof HttpException) {
      response.status(error.getStatus()).json(error.getResponse());
    } else {
      response.status(500).json({
        statusCode: 500,
        message: 'Unknown Error'
      });
    }
  }
}









