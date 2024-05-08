import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { User } from 'src/common/decorators/user.decorator';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { AuthUser } from '../auth/payloads/auth.payload';
import { CreateIbexAccountDto } from './dtos/create-account.dto';
import { CreateIbexAddressesDto } from './dtos/create-addresses.dto';
import { CreateIbexUsernameDto } from './dtos/create-username.dto';
import { IbexService } from './ibex.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('ibex')
@Controller('ibex')
export class IbexController {
    constructor(private ibexService: IbexService) {}

    @ApiOperation({ summary: 'Autologin operation' })
    @Post('autologin')
    login() {
        return this.ibexService.login();
    }

    @ApiOperation({ summary: 'Create username operation' })
    @Post('/usernames')
    createUsername(@Body() body: CreateIbexUsernameDto) {
        return this.ibexService.createUsername(body);
    }

    @ApiOperation({ summary: 'Create account operation' })
    @Post('/accounts')
    createAccount(@Body() body: CreateIbexAccountDto) {
        return this.ibexService.createUserIbexAccount(body.userId);
    }

    @ApiOperation({ summary: 'Create address operation' })
    @Post('/addresses')
    createAddress(@Body() body: CreateIbexAddressesDto) {
        return this.ibexService.createAddresses(body.ibexAccountId);
    }

    @ApiOperation({ summary: 'Get addresses operation' })
    @UseGuards(AccessTokenGuard)
    @Get('/addresses')
    getAddress(@User() user: AuthUser) {
        return this.ibexService.getAddresses(user);
    }

    @ApiOperation({ summary: 'Ibex webhook operation' })
    @ApiBearerAuth()
    @Post('')
    async ibexWebhook(@Query() query: string) {
        console.log('Query Params:', query);
    }
}
