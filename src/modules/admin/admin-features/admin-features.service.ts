import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { StillmanParams } from 'src/entities/stillman.entity';
import { TierFeature } from 'src/entities/tierFeature.entity';
import { TierFunding } from 'src/entities/tierFunding.entity';
import { WithdrawalMethod } from 'src/entities/withdrawalMethod.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { GetFundingByTierDto } from './dtos/getFundingByTier.dto';
import { UpdateTierFeatureDto } from './dtos/tierFeature.dto';
import { UpdateFundingMethodDto } from './dtos/updateFundingMethod.dto';
import { UpdateStillmanDTO } from './dtos/updateStillman.dto';
import { UpdateWithdrawlMethodDto } from './dtos/updateWithdrawlMethod.dto';

@Injectable()
export class AdminFeaturesService {
    constructor(
        @InjectRepository(TierFeature) private tierFeatureRepository: Repository<TierFeature>,
        @InjectRepository(WithdrawalMethod) private withdrawalMethodRepository: Repository<WithdrawalMethod>,
        @InjectRepository(TierFunding) private tierFundingRepository: Repository<TierFunding>,
        @InjectRepository(StillmanParams) private StillmanParamsRepository: Repository<StillmanParams>,
    ) {}

    async getWithdrawMethods() {
        const withdrawalMethods = await this.withdrawalMethodRepository.find();
        return withdrawalMethods;
    }

    async updateWithdrawalMethod(id: string, data: UpdateWithdrawlMethodDto) {
        if (!isUUID(id)) throw new BadRequestException('Invalid id');
        await this.withdrawalMethodRepository.update(id, {
            fee: data.fee,
            max: data.max,
            min: data.min,
            estimateTime: data.estimateTime,
            description: data.description,
        });
    }

    async getFundingMethods(query: GetFundingByTierDto) {
        const options: FindOptionsWhere<TierFunding>[] = [];
        if (query.tierId != null) {
            options.push({
                tier: { id: query.tierId },
            });
        }
        const fundingMethods = await this.tierFundingRepository.find({
            relations: { fundingMethod: true, tier: true },
            select: { fundingMethod: { name: true, description: true, estimateTime: true } },
            where: options,
        });
        return fundingMethods;
    }

    async updateFundingMethod(id: string, data: UpdateFundingMethodDto) {
        if (!isUUID(id)) throw new BadRequestException('Invalid id');
        await this.tierFundingRepository.update(id, {
            fee: data.fee,
            max: data.max,
            min: data.min,
            dailyLimit: data.dailyLimit,
            monthlyLimit: data.monthlyLimit,
            isActive: data.isActive,
        });
    }

    async getFeatures() {
        const tierFeatures = await this.tierFeatureRepository.find({
            relations: {
                feature: true,
                tier: true,
            },
        });
        return tierFeatures;
    }

    async updateTierFeature(id: string, data: UpdateTierFeatureDto) {
        if (!isUUID(id)) throw new BadRequestException('Invalid id');

        await this.tierFeatureRepository.update(id, {
            dailyLimit: data.dailyLimit,
            fee: data.fee,
            min: data.min,
            max: data.max,
            monthlyLimit: data.monthlyLimit,
        });
    }

    async updateStillman(data: UpdateStillmanDTO) {
        const params = await this.StillmanParamsRepository.find();
        if (!params[0]) throw new BadRequestException('Stillman Params not found');
        await this.StillmanParamsRepository.update(params[0].id, {
            buffer: data.buffer,
            balancePercentage: data.balancePercentage,
            stillmanAddress: data.stillmanAddress,
        });
    }
}
