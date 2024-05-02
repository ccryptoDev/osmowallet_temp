import { Body, Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { AdminAccessTokenGuard } from '../admin-auth/guards/accessToken.guard';
import { AdminFeaturesService } from './admin-features.service';
import { GetFundingByTierDto } from './dtos/getFundingByTier.dto';
import { UpdateTierFeatureDto } from './dtos/tierFeature.dto';
import { UpdateFundingMethodDto } from './dtos/updateFundingMethod.dto';
import { UpdateStillmanDTO } from './dtos/updateStillman.dto';
import { UpdateWithdrawlMethodDto } from './dtos/updateWithdrawlMethod.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(AdminAccessTokenGuard)
@ApiTags('Admin Features')
@Controller('admin/features')
@ApiBearerAuth()
export class AdminFeaturesController {
    constructor(private adminFeatureService: AdminFeaturesService) {}

    @Put('/withdrawal/methods/:id')
    @ApiOperation({ summary: 'Update withdrawal method' })
    updateWithdrawalMethod(@Param('id') id: string, @Body() data: UpdateWithdrawlMethodDto) {
        return this.adminFeatureService.updateWithdrawalMethod(id, data);
    }

    @Get('/withdrawal/methods')
    @ApiOperation({ summary: 'Get withdrawal methods' })
    getWithdrawalMethods() {
        return this.adminFeatureService.getWithdrawMethods();
    }

    @Put('/funding/methods/:id')
    @ApiOperation({ summary: 'Update funding method' })
    updateFundingMethod(@Param('id') id: string, @Body() data: UpdateFundingMethodDto) {
        return this.adminFeatureService.updateFundingMethod(id, data);
    }

    @Get('/funding/methods')
    @ApiOperation({ summary: 'Get funding methods' })
    getFundingMethods(@Query() query: GetFundingByTierDto) {
        return this.adminFeatureService.getFundingMethods(query);
    }

    @Put('/:id')
    @ApiOperation({ summary: 'Update tier feature' })
    updateTierFeature(@Param('id') id: string, @Body() data: UpdateTierFeatureDto) {
        return this.adminFeatureService.updateTierFeature(id, data);
    }

    @Get()
    @ApiOperation({ summary: 'Get tier features' })
    getTierFeatures() {
        return this.adminFeatureService.getFeatures();
    }

    @Put('/stillman')
    updateStillman(@Body() data: UpdateStillmanDTO) {
        return this.adminFeatureService.updateStillman(data);
    }
}
