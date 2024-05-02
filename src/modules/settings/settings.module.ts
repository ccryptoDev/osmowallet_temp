import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { App } from 'src/entities/app.entity';
import { Setting } from 'src/entities/setting.entity';
import { Terms, TermsSchema } from 'src/schemas/terms.schema';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: Terms.name, schema: TermsSchema }]), TypeOrmModule.forFeature([Setting, App])],
    providers: [SettingsService],
    controllers: [SettingsController],
    exports: [SettingsService],
})
export class SettingsModule {}
