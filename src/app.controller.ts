import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@ApiBearerAuth()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('referral-source')
  getReferralSource() {
    return this.appService.getReferralSource();
  }
}
