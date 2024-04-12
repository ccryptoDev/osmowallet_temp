import { Controller,UseGuards,UseInterceptors,ClassSerializerInterceptor,Post,Get,Req } from '@nestjs/common';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { TiersService } from './tiers.service';
import { Request } from 'express';


@UseGuards(AccessTokenGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('tiers')
export class TiersController {
    constructor(private tiersService: TiersService){}

}
