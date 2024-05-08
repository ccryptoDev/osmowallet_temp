import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { AuthUser } from '../auth/payloads/auth.payload';
import { CardService } from './card.service';
import { CreateCardDto } from './dtos/card.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('cards')
@Controller('cards')
@ApiBearerAuth()
export class CardController {
    constructor(private cardService: CardService) {}

    @ApiOperation({ summary: 'Create a public payment method' })
    @Post('/public')
    createPublicPaymentMethod(@Body() body: CreateCardDto) {
        return this.cardService.createPublicPaymentMethod(body);
    }

    @UseGuards(AccessTokenGuard)
    @ApiOperation({ summary: 'Delete a card' })
    @Delete('/:id')
    deleteCard(@Req() req: Request, @Param('id') id: string) {
        return this.cardService.deletePaymentMethod(req.user as AuthUser, id);
    }

    @UseGuards(AccessTokenGuard)
    @ApiOperation({ summary: 'Create a card' })
    @Post()
    createCard(@Req() req: Request, @Body() body: CreateCardDto) {
        return this.cardService.createPaymentMethod(req.user as AuthUser, body);
    }

    @UseGuards(AccessTokenGuard)
    @ApiOperation({ summary: 'Get all cards' })
    @Get()
    getCards(@Req() req: Request) {
        return this.cardService.getPaymentMethods(req.user as AuthUser);
    }

    @UseGuards(AccessTokenGuard)
    @ApiOperation({ summary: 'Set a card as default' })
    @Patch('/:id/set-default')
    setDefaultCard(@Param('id') id: string, @Req() req: Request) {
        return this.cardService.setDefaultCard(id, req.user as AuthUser);
    }
}
