import { Controller, Req, UseGuards,Body,Get,Put,Post } from '@nestjs/common';
import { BillsService } from './bills.service';
import { Request } from 'express';
import { AuthUser } from '../auth/payloads/auth.payload';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { NitDto } from './dtos/nit.dto';
import { CreateBillDto } from './dtos/createBill.dto';

@Controller('bills')
export class BillsController {
    constructor(private billService: BillsService){}

    @Post('/send')
    async sendBills(){
        return this.billService.sendBills()
    }

    @Post()
    async createBill(@Body() data: CreateBillDto){
        return this.billService.createUserBill(data)
    }

    @UseGuards(AccessTokenGuard)
    @Get('/nit')
    async getNit(@Req() req: Request){
        return this.billService.getNit(req.user as AuthUser)
    }

    @UseGuards(AccessTokenGuard)
    @Put('/nit')
    async updateNit(@Req() req: Request, @Body() data: NitDto) {
        return this.billService.updateNit(req.user as AuthUser,data)
    }
}
