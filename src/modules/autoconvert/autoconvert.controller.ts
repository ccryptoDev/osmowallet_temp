import { Body, ClassSerializerInterceptor, Controller, Get, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { AutoconvertService } from './autoconvert.service';
import { AuthUser } from '../auth/payloads/auth.payload';
import { AutoConvertDto } from './dtos/autoconvert.dto';
import { Request} from 'express';

@UseGuards(AccessTokenGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('autoconvert')
export class AutoconvertController {
    constructor(private autoconvertService: AutoconvertService){}

    @Get('')
    getAutoConvert(@Req() req: Request){
        const authUser: AuthUser = {sub: req.user['sub']}
        return this.autoconvertService.getAutoConvert(authUser)
    }


    @Post('')
    updateAutoconvert(@Req() req: Request, @Body() data: AutoConvertDto){
        const authUser: AuthUser = {sub: req.user['sub']}
        return this.autoconvertService.updateAutoconvert(authUser,data)
    }
}
