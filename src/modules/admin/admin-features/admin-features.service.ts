import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { TierFeature } from 'src/entities/tierFeature.entity';
import { Repository } from 'typeorm';
import { UpdateTierFeatureDto } from './dtos/tierFeature.dto';
import { FundingMethod } from 'src/entities/fundingMethod.entity';
import { UpdateFundingMethodDto } from './dtos/updateFundingMethod.dto';
import { WithdrawalMethod } from 'src/entities/withdrawalMethod.entity';

@Injectable()
export class AdminFeaturesService {
    constructor(
        @InjectRepository(TierFeature) private tierFeatureRepository: Repository<TierFeature>,
        @InjectRepository(FundingMethod) private fundingMethodRepository: Repository<FundingMethod>,
        @InjectRepository(WithdrawalMethod) private withdrawalMethodRepository: Repository<WithdrawalMethod>,
    ){}

    async getWithdrawMethods() {
        const withdrawalMethods = await this.withdrawalMethodRepository.find()
        return withdrawalMethods
    }

    async updateWithdrawalMethod(id: string, data: UpdateFundingMethodDto) {
        if(!isUUID(id)) throw new BadRequestException('Invalid id')
        await this.withdrawalMethodRepository.update(id, {
            fee: data.fee,
            max: data.max,
            min: data.min,
            estimateTime: data.estimateTime,
            description: data.description
        })
    }

    async getFundingMethods() {
        const fundingMethods = await this.fundingMethodRepository.find()
        return fundingMethods
    }

    async updateFundingMethod(id: string, data: UpdateFundingMethodDto) {
        if(!isUUID(id)) throw new BadRequestException('Invalid id')
        await this.fundingMethodRepository.update(id, {
            fee: data.fee,
            max: data.max,
            min: data.min,
            estimateTime: data.estimateTime,
            description: data.description
        })
    }

    async getFeatures() {
        const tierFeatures = await this.tierFeatureRepository.find({
            relations: {
                feature: true,
                tier: true
            }
        })
        return tierFeatures
    }

    async updateTierFeature(id: string, data: UpdateTierFeatureDto) {
        if(!isUUID(id)) throw new BadRequestException('Invalid id')

        await this.tierFeatureRepository.update(id, {
            dailyLimit: data.dailyLimit,
            fee: data.fee,
            min: data.min,
            max: data.max,
            monthlyLimit: data.monthlyLimit,
        })

    }

}
