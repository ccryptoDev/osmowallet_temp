import { Controller, Get, Query, Req, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthDto } from '../auth/dto/auth.dto';
import { GrantType } from '../auth/enums/granTypes.enum';
import { TermsAndConditionsDto } from './dtos/getTermsAndConditions.dto';
import { SettingsService } from './settings.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('settings')
@ApiTags('Settings')
export class SettingsController {
    constructor(private settingService: SettingsService) {}

    @Get('/terms')
    @ApiOperation({ summary: 'Get terms and conditions' })
    @ApiBearerAuth()
    getTermsAndConditions(@Req() req: Request, @Query() query: TermsAndConditionsDto) {
        if (req.headers.clientid == null || req.headers.clientsecret == null) throw new UnauthorizedException();
        const authDto: AuthDto = {
            clientId: req.headers.clientid.toString(),
            clientSecret: req.headers.clientsecret.toLocaleString(),
            grantType: GrantType.Password,
        };
        return this.settingService.getTermsAndConditions(authDto, query);
    }

    @Get()
    @ApiOperation({ summary: 'Get settings' })
    @ApiBearerAuth()
    async getSettings(@Req() req: Request) {
        if (req.headers.clientid == null || req.headers.clientsecret == null) throw new UnauthorizedException();
        const authDto: AuthDto = {
            clientId: req.headers.clientid.toString(),
            clientSecret: req.headers.clientsecret.toLocaleString(),
            grantType: GrantType.Password,
        };
        await this.settingService.validateApp(authDto);
        return this.settingService.getSettings();
    }
}
