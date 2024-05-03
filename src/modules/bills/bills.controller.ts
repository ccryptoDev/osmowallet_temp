import { Controller, Req, UseGuards, Body, Get, Put, Post } from '@nestjs/common';
import { BillsService } from './bills.service';
import { Request } from 'express';
import { AuthUser } from '../auth/payloads/auth.payload';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { NitDto } from './dtos/nit.dto';
import { CreateBillDto } from './dtos/createBill.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('bills')
@Controller('bills')
export class BillsController {
    constructor(private billService: BillsService) {}

    @ApiBearerAuth()
    @ApiOperation({ summary: 'Send bills' })
    @Post('/send')
    async sendBills() {
        return this.billService.sendBills();
    }

    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a bill' })
    @Post()
    async createBill(@Body() data: CreateBillDto) {
        return this.billService.createUserBill(data);
    }

    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get NIT' })
    @UseGuards(AccessTokenGuard)
    @Get('/nit')
    async getNit(@Req() req: Request) {
        return this.billService.getNit(req.user as AuthUser);
    }

    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update NIT' })
    @UseGuards(AccessTokenGuard)
    @Put('/nit')
    async updateNit(@Req() req: Request, @Body() data: NitDto) {
        return this.billService.updateNit(req.user as AuthUser, data);
    }
}
