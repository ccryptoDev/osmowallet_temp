import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { Request} from 'express'
import { AuthUser } from '../auth/payloads/auth.payload';
import { CreateBlockChainAddress } from './dtos/blockchainAddress.dto';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';

@UseGuards(AccessTokenGuard)
@Controller('blockchain')
export class BlockchainController {

    constructor(private blockChainService: BlockchainService){}
    
    @Get('/osmo-addresses')
    getOsmoBlockchainAddresses() {
        return this.blockChainService.getOsmoAddresses()
    }

    @Get('/networks')
    getBlockchainNetworks() {
        return this.blockChainService.getBlockchainNetworks()
    }

    @Get('/addresses')
    getBlockchainAddresses(@Req() req: Request) {
        return this.blockChainService.getBlockChainAddresses(req.user as AuthUser)
    }

    @Post('/addresses')
    createAddress(@Req() req: Request, @Body() data: CreateBlockChainAddress) {
        return this.blockChainService.createBlockChainAddress(req.user as AuthUser, data)
    }

    @Put('/addresses/:id')
    updateAddress(@Param('id') id: string, @Body() data: CreateBlockChainAddress){
        return this.blockChainService.updateBlockChainAddress(id, data)
    }

    @Delete('/addresses/:id')
    deleteAddress(@Param('id') id: string){
        return this.blockChainService.deleteBlockChainAddress(id)
    }

}
