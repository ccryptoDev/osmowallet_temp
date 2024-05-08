import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateAccountDto } from './modules/wallets/dto/createAccount.dto';
import { WalletsService } from './modules/wallets/wallets.service';
import { CreateWalletDto } from './modules/wallets/dto/createWallet.dto';

@ApiTags('App')
@ApiBearerAuth()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService,
    private readonly walletService: WalletsService
  ) { }

  @Get('referral-source')
  getReferralSource() {
    return this.appService.getReferralSource();
  }

 
}
