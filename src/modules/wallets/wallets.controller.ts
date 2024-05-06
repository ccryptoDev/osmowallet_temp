import { Body, Controller, Get, Param, Post, Patch, Req, UseGuards } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import {
    Request
} from 'express';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { CreateAccountDto } from './dtos/createAccount.dto';
import { CreateWalletDto } from './dtos/createWallet.dto';

@ApiTags('Wallets')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller('wallets')
export class WalletsController {
    constructor(private walletService: WalletsService) { }

    @ApiOperation({ summary: 'Hide a wallet' })
    @Patch('/:id/hide')
    hideWallet(@Param('id') id: string) {
        return this.walletService.hideWallet(id)
    }

    @ApiOperation({ summary: 'Show a wallet' })
    @Patch('/:id/show')
    showWallet(@Param('id') id: string) {
        return this.walletService.showWallet(id)
    }

    @ApiOperation({ summary: 'Get all wallets' })
    @Get()
    getWallets(@Req() req: Request) {
        return this.walletService.getWalletsByUser(req.user['sub'])
    }

    @Post('createAccount')
    async createAccount(@Body() createAccountDto: CreateAccountDto) {
        return this.walletService.createAccount(createAccountDto);
    }

    @Post(':accountId/wallets/create')
    async createWallet(
        @Param('accountId') accountId: string,
        @Body() createWalletDto: CreateWalletDto,
    ) {
        return this.walletService.createWallet(accountId, createWalletDto);
    }
}
