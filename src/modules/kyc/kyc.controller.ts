import { Controller,Post,Req,Body, Get, ClassSerializerInterceptor, UseInterceptors, UseGuards, Param } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycQueueDto } from './dtos/queue.dto';
import { AuthUser } from '../auth/payloads/auth.payload';
import { Request } from 'express';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { MetamapGuard } from '../auth/guards/metamap.guard';
import { KycFormDto } from './dtos/form.dto';


@Controller('kyc')
export class KycController {
    constructor(private kycService: KycService){}

    @UseGuards(AccessTokenGuard)
    @Get('/partner-statuses')
    async getKycPartnerStatuses(@Req() req: Request) {
        const kycs = await this.kycService.getKycPartnerStatuses(req.user as AuthUser)
        if(!kycs) return {}
        return kycs
    }


    @UseGuards(AccessTokenGuard)
    @Post('/form')
    createCRKycForm(@Req() req: Request,@Body() body: KycFormDto) {
        return this.kycService.createForm(req.user as AuthUser, body)
    }

    @UseGuards(AccessTokenGuard)
    @Get('/form')
    getCRKycForm(@Req() req: Request) {
        return this.kycService.getForm(req.user as AuthUser)
    }

    @UseGuards(MetamapGuard)
    @Post('/wf')
    createWorkFlow(@Req() req: Request, @Body() data: any) {
        console.log(data)
        return this.kycService.manageEvent(data)
    }

    @Post('/country')
    updateCountryAndName(@Body() data: KycQueueDto) {
        return this.kycService.saveCountry(data.verificationId)
    }

    @UseGuards(AccessTokenGuard)
    @Get('/validate')
    validateUser(@Req() req: Request){
        const authUser: AuthUser = {sub: req.user['sub']}
        return this.kycService.validate(authUser)
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @UseGuards(AccessTokenGuard)
    @Get('/')
    async getVerification(@Req() req: Request){
        const authUser: AuthUser = {sub: req.user['sub']}
        const verification = await this.kycService.getKycVerification(authUser)
        if(!verification) return {}
        return verification
    }

    @Get('/:id/raw-kyc')
    async getRawKyc(@Param(':id') id: string){
        return this.kycService.getRawKyc(id)
    }

}

