import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { AuthUser } from '../auth/payloads/auth.payload';
import { WalletsService } from './wallets.service';
import { CreateAccountDto } from './dto/createAccount.dto';
import { CreateWalletDto } from './dto/createWallet.dto';

@ApiTags('Wallets')
@ApiBearerAuth()
// @UseGuards(AccessTokenGuard)
@Controller('wallets')
export class WalletsController {
    constructor(private walletService: WalletsService) {}

    @ApiOperation({ summary: 'Hide a wallet' })
    @Patch('/:id/hide')
    hideWallet(@Param('id') id: string) {
        return this.walletService.hideWallet(id);
    }

    @ApiOperation({ summary: 'Show a wallet' })
    @Patch('/:id/show')
    showWallet(@Param('id') id: string) {
        return this.walletService.showWallet(id);
    }

    @ApiOperation({ summary: 'Get all wallets' })
    @Get()
    getWallets(@User() user: AuthUser) {
        return this.walletService.getWalletsByUser(user.sub);
    }

    @ApiOperation({ summary: 'Update wallet status' })
    @Patch('/:id/desactive')
    updateWalletDesactive(@Param('id') id: string) {
        return this.walletService.updateWalletDesactive(id);
    }

    @ApiOperation({ summary: 'Update wallet status' })
    @Patch('/:id/active')
    updateWalletActive(@Param('id') id: string) {
        return this.walletService.updateWalletActive(id);
    }
    
    @Post('/createAccount')
    async createAccount(@Body() createAccountDto: CreateAccountDto) {
        return this.walletService.createAccount(createAccountDto);
    }

    @Post('/createWallet')
    async createWallet(
        @Body() createWalletDto: CreateWalletDto,
    ) {
        return this.walletService.createWallet(createWalletDto);
    }
}
