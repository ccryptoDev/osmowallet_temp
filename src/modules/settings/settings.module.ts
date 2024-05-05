import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from 'src/entities/setting.entity';
import { App } from 'src/entities/app.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { Terms, TermsSchema } from 'src/schemas/terms.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Terms.name, schema: TermsSchema}
    ]),
    TypeOrmModule.forFeature([
      Setting,
      App
    ])
  ],
  providers: [SettingsService],
  controllers: [SettingsController],
  exports: [SettingsService]
})
export class SettingsModule {}
