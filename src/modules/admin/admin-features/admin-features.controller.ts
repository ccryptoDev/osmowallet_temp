import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { AdminFeaturesService } from './admin-features.service';
import { UpdateTierFeatureDto } from './dtos/tierFeature.dto';
import { UpdateFundingMethodDto } from './dtos/updateFundingMethod.dto';
import { AdminAccessTokenGuard } from '../admin-auth/guards/accessToken.guard';

@UseGuards(AdminAccessTokenGuard)
@Controller('admin/features')
export class AdminFeaturesController {
    constructor(private adminFeatureService: AdminFeaturesService){}

    @Put('/withdrawal/methods/:id')
    updateWithdrawalMethod(@Param('id') id: string, @Body() data: UpdateFundingMethodDto) {
        return this.adminFeatureService.updateWithdrawalMethod(id,data)
    }

    @Get('/withdrawal/methods')
    getWithdrawalMethods() {
        return this.adminFeatureService.getWithdrawMethods()
    }

    @Put('/funding/methods/:id')
    updateFundingMethod(@Param('id') id: string, @Body() data: UpdateFundingMethodDto) {
        return this.adminFeatureService.updateFundingMethod(id,data)
    }

    @Get('/funding/methods')
    getFundingMethods() {
        return this.adminFeatureService.getFundingMethods()
    }

    @Put('/:id')
    updateTierFeature(@Param('id') id: string, @Body() data: UpdateTierFeatureDto){
        return this.adminFeatureService.updateTierFeature(id,data)
    }

    @Get()
    getTierFeatures() {
        return this.adminFeatureService.getFeatures()
    }
}
