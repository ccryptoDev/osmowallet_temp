import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { App } from 'src/entities/app.entity';
import { Setting } from 'src/entities/setting.entity';
import { Repository } from 'typeorm';
import { AuthDto } from '../auth/dto/auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Terms } from 'src/schemas/terms.schema';
import { Model } from 'mongoose';
import { TermsAndConditionsDto } from './dtos/getTermsAndConditions.dto';
import { UpdateSettingDto } from './dtos/update-setting.dto';

@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(Setting) private settingRepository: Repository<Setting>,
        @InjectRepository(App) private appRepository: Repository<App>,
        @InjectModel(Terms.name) private termsModel: Model<Terms>,
    ){}

    async validateApp(data: AuthDto){
        const app = await this.appRepository.findOneBy({
            clientId: data.clientId,
            clientSecret: data.clientSecret,
          });
      
        if (!app) throw new UnauthorizedException();
        if (!app.name.toLowerCase().includes('osmo')) throw new UnauthorizedException();
    }

    async getTermsAndConditions(data: AuthDto, query: TermsAndConditionsDto){
        const app = await this.appRepository.findOneBy({
            clientId: data.clientId,
            clientSecret: data.clientSecret,
          });
      
        if (!app) throw new UnauthorizedException();
        if (!app.name.toLowerCase().includes('osmo')) throw new UnauthorizedException();

        let terms = await this.termsModel.findOne({
            country: query.country
        })
        if(!terms) {
            terms = await this.termsModel.findOne({
                country: 'WORLD'
            })
        }
        return terms
    }

    async getSettings() {
        return await this.settingRepository.find()
    }

    async updateSetting(id: string, data: UpdateSettingDto) {
        const setting = await this.settingRepository.findOneBy({ id })
        if(!setting) throw new BadRequestException('Invalid setting')
        await this.settingRepository.update(id,{
            value: data.value
        })
    }
}
