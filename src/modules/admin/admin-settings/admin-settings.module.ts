import { Module } from '@nestjs/common';
import { SettingsModule } from 'src/modules/settings/settings.module';
import { AdminSettingsController } from './admin-settings.controller';

@Module({
    imports: [SettingsModule],
    controllers: [AdminSettingsController],
})
export class AdminSettingsModule {}
