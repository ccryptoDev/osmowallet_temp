import { Controller, Get,Post,Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  
  @Get('referral-source')
  getReferralSource() {
    return this.appService.getReferralSource();
  }
}
