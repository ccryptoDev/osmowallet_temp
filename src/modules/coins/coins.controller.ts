import { ClassSerializerInterceptor, Controller, Get, NotFoundException, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { User } from 'src/common/decorators/user.decorator';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { AuthUser } from '../auth/payloads/auth.payload';
import { UsersService } from '../users/users.service';
import { CoinsService } from './coins.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('coins')
@Controller('coins')
export class CoinsController {
    constructor(
        private coinService: CoinsService,
        private userService: UsersService,
    ) {}

    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get coins by country' })
    @UseGuards(AccessTokenGuard)
    @Get('/country')
    async getCoinsByCountry(@User() authUser: AuthUser) {
        const user = await this.userService.getUserById(authUser.sub);
        if (!user) throw new NotFoundException('User not found');
        return this.coinService.getCoinsByResidence(user.residence);
    }

    @ApiOperation({ summary: 'Update exchange rates' })
    @Post('/updateRates')
    updateRates() {
        return this.coinService.updateExchangesRates();
    }

    @ApiOperation({ summary: 'Get all coins' })
    @UseInterceptors(ClassSerializerInterceptor)
    @Get()
    async getCoins() {
        return this.coinService.getAll();
    }

    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get BTC price' })
    @UseGuards(AccessTokenGuard)
    @Get('/btc-price')
    async getBtcPrice() {
        return this.coinService.getBtcPrice();
    }
}
