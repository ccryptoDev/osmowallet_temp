import { ClassSerializerInterceptor, Controller, Get, Param, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { AuthUser } from '../auth/payloads/auth.payload';
import { FeaturesService } from './features.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Features')
@UseGuards(AccessTokenGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('features')
export class FeaturesController {
    constructor(private featureService: FeaturesService) {}

    @ApiOperation({ summary: 'Get tier feature by ID' })
    @ApiBearerAuth()
    @Get('/:id/')
    getTierFeature(@Param('id') id: string, @Req() req: Request) {
        return this.featureService.getTierFeature(id, req.user as AuthUser);
    }

    @ApiOperation({ summary: 'Get all features' })
    @ApiBearerAuth()
    @Get('')
    getFeatures(@Req() req: Request) {
        return this.featureService.getFeatures(req.user as AuthUser);
    }
}
