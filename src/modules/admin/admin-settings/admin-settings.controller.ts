import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { UpdateSettingDto } from 'src/modules/settings/dtos/update-setting.dto';
import { SettingsService } from 'src/modules/settings/settings.service';
import { AdminAccessTokenGuard } from '../admin-auth/guards/accessToken.guard';

@UseGuards(AdminAccessTokenGuard)
@Controller('admin/settings')
export class AdminSettingsController {
    constructor(private settingsService: SettingsService){}

    @Get()
    async getSettingService(){
        return this.settingsService.getSettings()
    }

    @Patch('/:id')
    updateSetting(@Param('id') id: string, @Body() body: UpdateSettingDto){
        return this.settingsService.updateSetting(id,body)
    }
}
