import { ClassSerializerInterceptor, Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { BankService } from './banks.service';
import { OsmoBankAccountQueryDto } from './dtos/osmoBankAccount.dto';

@Controller('banks')
@ApiTags('Banks')
@ApiBearerAuth()
export class BankController {
    constructor(private bankService: BankService) {}

    @UseGuards(AccessTokenGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    @Get()
    @ApiOperation({ summary: 'Get all banks' })
    getAllBanks() {
        return this.bankService.getAllBanks();
    }

    @UseGuards(AccessTokenGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    @Get('/osmo-accounts')
    @ApiOperation({ summary: 'Get Osmo bank accounts' })
    getOsmoBankAccounts(@Query() params: OsmoBankAccountQueryDto) {
        return this.bankService.getOsmoBankAccounts(params);
    }
}
