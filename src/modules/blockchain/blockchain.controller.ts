import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { AuthUser } from '../auth/payloads/auth.payload';
import { BlockchainService } from './blockchain.service';
import { CreateBlockChainAddress } from './dtos/blockchainAddress.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(AccessTokenGuard)
@ApiTags('Blockchain')
@Controller('blockchain')
@ApiBearerAuth()
export class BlockchainController {
    constructor(private blockChainService: BlockchainService) {}

    @Get('/osmo-addresses')
    @ApiOperation({ summary: 'Get Osmo blockchain addresses' })
    getOsmoBlockchainAddresses() {
        return this.blockChainService.getOsmoAddresses();
    }

    @Get('/networks')
    @ApiOperation({ summary: 'Get blockchain networks' })
    getBlockchainNetworks() {
        return this.blockChainService.getBlockchainNetworks();
    }

    @Get('/addresses')
    @ApiOperation({ summary: 'Get blockchain addresses' })
    getBlockchainAddresses(@Req() req: Request) {
        return this.blockChainService.getBlockChainAddresses(req.user as AuthUser);
    }

    @Post('/addresses')
    @ApiOperation({ summary: 'Create blockchain address' })
    createAddress(@Req() req: Request, @Body() data: CreateBlockChainAddress) {
        return this.blockChainService.createBlockChainAddress(req.user as AuthUser, data);
    }

    @Put('/addresses/:id')
    @ApiOperation({ summary: 'Update blockchain address' })
    updateAddress(@Param('id') id: string, @Body() data: CreateBlockChainAddress) {
        return this.blockChainService.updateBlockChainAddress(id, data);
    }

    @Delete('/addresses/:id')
    @ApiOperation({ summary: 'Delete blockchain address' })
    deleteAddress(@Param('id') id: string) {
        return this.blockChainService.deleteBlockChainAddress(id);
    }
}
