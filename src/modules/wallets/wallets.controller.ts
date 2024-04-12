import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { Request
 } from 'express';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';

@UseGuards(AccessTokenGuard)
@Controller('wallets')
export class WalletsController {
    constructor(private walletService: WalletsService){}

    @Patch('/:id/hide')
    hideWallet(@Param('id') id: string){
        return this.walletService.hideWallet(id)
    }

    @Patch('/:id/show')
    showWallet(@Param('id') id: string){
        return this.walletService.showWallet(id)
    }

    @Get()
    getWallets(@Req() req: Request){
        return this.walletService.getWalletsByUser(req.user['sub'])
    }
}
