import { Controller, Post, Body } from '@nestjs/common';
import { IbexService } from './ibex.service';
import { CreateIbexAddressesDto } from './dtos/create-addresses.dto';
import { CreateIbexAccountDto } from './dtos/create-account.dto';
import { CreateIbexUsernameDto } from './dtos/create-username.dto';
@Controller('ibex')
export class IbexController {
    constructor(private ibexService: IbexService) { }

    @Post('autologin')
    login() {
        return this.ibexService.login()
    }

    @Post('/usernames')
    createUsername(@Body() body: CreateIbexUsernameDto) {
        return this.ibexService.createUsername(body)
    }

    @Post('/accounts')
    createAccount(@Body() body: CreateIbexAccountDto) {
        return this.ibexService.createUserIbexAccount(body.userId)
    }

    @Post('/addresses')
    createAddress(@Body() body: CreateIbexAddressesDto) {
        return this.ibexService.createAddresses(body.ibexAccountId)
    }
}
