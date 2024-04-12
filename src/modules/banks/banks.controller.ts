import { ClassSerializerInterceptor, Controller,Get, Post, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { BankService } from './banks.service';
import { AccessTokenCombinedGuard } from '../auth/guards/combined/accessTokenCombined.guard';
import { OsmoBankAccountQueryDto } from './dtos/osmoBankAccount.dto';

@Controller('banks')
export class BankController {
    constructor(private bankService: BankService){}

    @UseGuards(AccessTokenGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    @Get()
    getAllBanks(){
      return  this.bankService.getAllBanks()
    }

    @UseGuards(AccessTokenGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    @Get('/osmo-accounts')
    getOsmoBankAccounts(@Query() params: OsmoBankAccountQueryDto){
      return  this.bankService.getOsmoBankAccounts(params)
    }
}
