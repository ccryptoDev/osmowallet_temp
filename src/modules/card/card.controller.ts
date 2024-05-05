import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { Request
 } from 'express';
import { CardService } from './card.service';
import { AuthUser } from '../auth/payloads/auth.payload';
import { CreateCardDto } from './dtos/card.dto';
@Controller('cards')
export class CardController {

    constructor(private cardService: CardService){}

    @Post('/public')
    createPublicPaymentMethod(@Body() body: CreateCardDto){
        return this.cardService.createPublicPaymentMethod(body)
    }

    @UseGuards(AccessTokenGuard)
    @Delete('/:id')
    deleteCard(@Req() req: Request, @Param('id') id: string) {
        return this.cardService.deletePaymentMethod(req.user as AuthUser, id)
    }

    @UseGuards(AccessTokenGuard)
    @Post()
    createCard(@Req() req: Request, @Body() body: CreateCardDto){
        return this.cardService.createPaymentMethod(req.user as AuthUser, body)
    }

    @UseGuards(AccessTokenGuard)
    @Get()
    getCards(@Req() req: Request){
        return this.cardService.getPaymentMethods(req.user as AuthUser)
    }

    @UseGuards(AccessTokenGuard)
    @Patch('/:id/set-default')
    setDefaultCard(@Param('id') id: string,@Req() req: Request){
        return this.cardService.setDefaultCard(id, req.user as AuthUser)
    }
}
