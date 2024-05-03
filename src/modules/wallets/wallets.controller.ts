import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { User } from 'src/common/decorators/user.decorator';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { AuthUser } from '../auth/payloads/auth.payload';
import { WalletsService } from './wallets.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Wallets')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
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
}
