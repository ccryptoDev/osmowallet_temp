import {
    Controller,
    Post,
    Req,
    Body,
    Get,
    ClassSerializerInterceptor,
    UseInterceptors,
    UseGuards,
    Param,
    ParseUUIDPipe,
} from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycQueueDto } from './dtos/queue.dto';
import { AuthUser } from '../auth/payloads/auth.payload';
import { Request } from 'express';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { MetamapGuard } from '../auth/guards/metamap.guard';
import { User } from 'src/common/decorators/user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('kyc')
@Controller('kyc')
export class KycController {
    constructor(private kycService: KycService) {}

    @UseGuards(AccessTokenGuard)
    @Get('/partner-statuses')
    @ApiOperation({ summary: 'Get KYC partner statuses' })
    async getKycPartnerStatuses(@Req() req: Request) {
        const kycs = await this.kycService.getKycPartnerStatuses(req.user as AuthUser);
        if (!kycs) return {};
        return kycs;
    }

    @UseGuards(MetamapGuard)
    @Post('/wf')
    @ApiOperation({ summary: 'Create workflow' })
    @ApiBearerAuth()
    createWorkFlow(@Req() req: Request, @Body() data: any) {
        console.log(data);
        return this.kycService.manageEvent(data);
    }

    @Post('/country')
    @ApiOperation({ summary: 'Update country and name' })
    updateCountryAndName(@Body() data: KycQueueDto) {
        return this.kycService.saveCountry(data.verificationId);
    }

    @UseGuards(AccessTokenGuard)
    @Get('/validate')
    @ApiOperation({ summary: 'Validate user' })
    @ApiBearerAuth()
    validateUser(@User() user: AuthUser) {
        return this.kycService.validate(user);
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @UseGuards(AccessTokenGuard)
    @Get('/')
    @ApiOperation({ summary: 'Get KYC verification' })
    @ApiBearerAuth()
    async getVerification(@User() user: AuthUser) {
        const verification = await this.kycService.getKycVerification(user);
        if (!verification) return {};
        return verification;
    }

    @Get('/:id/raw-kyc')
    @ApiOperation({ summary: 'Get raw KYC' })
    async getRawKyc(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.kycService.getRawKyc(id);
    }
}
