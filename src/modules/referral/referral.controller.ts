import { Controller,UseGuards,UseInterceptors,ClassSerializerInterceptor,Body,Req,Post } from '@nestjs/common';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { ReferralService } from './referral.service';
import { Request } from 'express';
import { OsmoReferralDto } from './dtos/osmoReferral.dto';
import { RefundReferral } from './interfaces/refund.interface';



@UseInterceptors(ClassSerializerInterceptor)
@Controller('referral')
export class ReferralController {
    
    constructor(private referralService: ReferralService){}

    @Post('/check-referral-invitations')
    async checkReferralInvitations(){
        return this.referralService.checkExpiredInvitation()
    }

    @Post('/refund')
    async refundReferral(@Req() req: Request, @Body() data: RefundReferral){
        if(data.isOsmoSponsor){
            return this.referralService.refundOsmoReferralTransaction(data)
        }else{
            return this.referralService.refundSmsTransaction(data)
        }
    }

    @UseGuards(AccessTokenGuard)
    @Post('/generate-invitation')
    async generateInvitation(@Req() req: Request, @Body() data: OsmoReferralDto){
        const userId = req.user['sub']
        return this.referralService.generateInvitation(userId,data)
    }
}
