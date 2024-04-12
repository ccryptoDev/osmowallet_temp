import { Controller,UseInterceptors,Req,Post,Body,Get, UnauthorizedException} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FundingService } from './funding.service';
import { UploadedFile, UseGuards } from '@nestjs/common/decorators';
import { Request,Express } from 'express';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { ClassSerializerInterceptor } from '@nestjs/common/serializer';
import { AuthUser } from '../auth/payloads/auth.payload';
import { FundingDto } from './dtos/funding.dto';
import { OnvoCheckoutSuccess } from './interfaces/onvo.checkout.success';



@UseInterceptors(ClassSerializerInterceptor)
@Controller('funding')
export class FundingController {
    constructor(private fundingService: FundingService){}

    @Post('/onvo')
    manageOnvoEvents(@Req() req: Request, @Body() body: OnvoCheckoutSuccess) {
        const webhookSecret = req.headers['x-webhook-secret']
        if(webhookSecret != process.env.ONVO_WEBHOOK_SECRET) throw new UnauthorizedException()
        return this.fundingService.createOnvoFundingTransaction(body)
    }

    @UseGuards(AccessTokenGuard)
    @Get('/methods')
    funding(@Req() req: Request){
        const authUser: AuthUser = {sub: req.user['sub']}
        return this.fundingService.getFundingMethods(authUser)
    }

    @UseGuards(AccessTokenGuard)
    @Post('/')
    @UseInterceptors(FileInterceptor('file'))
    fundStable(@Req() req: Request, @Body() data: FundingDto, @UploadedFile() file: Express.Multer.File) {
        const authUser: AuthUser = {sub: req.user['sub']}
        return this.fundingService.fund(authUser,data,file)
    }

}
