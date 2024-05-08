import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Feature } from 'src/entities/feature.entity';
import { TierFeature } from 'src/entities/tierFeature.entity';
import { TierUser } from 'src/entities/tierUser.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/payloads/auth.payload';
import { UserFeature } from 'src/entities/feat-user.entity';
import { FeatureEnum } from 'src/common/enums/feature.enum';

@Injectable()
export class FeaturesService {
    constructor(
        @InjectRepository(Feature) private featureRepository: Repository<Feature>,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(TierUser) private tierUserRepository: Repository<TierUser>,
        @InjectRepository(TierFeature) private tierFeatureRepository: Repository<TierFeature>,
        @InjectRepository(UserFeature) private featureUserRepository: Repository<UserFeature>,
    ) {}

    async getTierFeature(id: string, authUser: AuthUser) {
        const tierFeature = await this.tierFeatureRepository
            .createQueryBuilder('tierFeature')
            .leftJoinAndSelect('tierFeature.feature', 'feature')
            .leftJoin('tierFeature.tier', 'tier')
            .leftJoin('tier.tierUsers', 'tierUser')
            .where('tierUser.user = :userId', { userId: authUser.sub })
            .andWhere('tierFeature.feature = :featureId', { featureId: id })
            .getOne();
        // delete tierFeature.feature
        if (!tierFeature) {
            throw new Error('Tier feature not found');
        }
        return tierFeature;
    }

    async getFeatures(authUser: AuthUser) {
        const user = await this.userRepository.findOneBy({ id: authUser.sub });
        const features = await this.featureRepository.find({
            relations: {
                countries: {
                    country: true,
                },
                platforms: true,
            },
        });
        const featuresAvailabilities = await this.featureUserRepository.find({
            relations: {
                feature: true
            },
            where: {
                user: {id: authUser.sub}
            }
        })
        return features.map((feature) => {
            const available = feature.countries.some((country) => country.country.code === user?.residence);
            const { id, name } = feature;
            const featureAvailability = featuresAvailabilities.find(userFeature => feature.id == userFeature.feature.id)
            const isActive = feature.isActive && featureAvailability?.isActive
            const platforms = feature.platforms.map((platform) => ({ isActive: platform.active, platform: platform.platform }));
            return { id: id, name, platforms, isActive, availableCountry: available };
        });
    }

    async checkFeatureAvailability(authUser: AuthUser, featureName: FeatureEnum) : Promise<void>{
        const user = await this.userRepository.findOneBy({ id: authUser.sub });
        const featureAvailability = await this.featureUserRepository.findOne({
            where: {
                user: {id: authUser.sub},
                feature: {
                    name: featureName,
                }
            }
        })
        const feature = await this.featureRepository.findOne({
            relations: {
                countries: {
                    country: true,
                },
            },
            where: {
                name: featureName
            }
        });
        const countryAvailable = feature?.countries.some((country) => country.country.code === user?.residence);
        const isAvailable = featureAvailability?.isActive && feature?.isActive && countryAvailable
        if(!isAvailable) throw new BadRequestException('Feature unavailable')
    }

    async getUserFeatureAvailabilitiesByUser(userId: string) {
        return await this.featureUserRepository.find({
            relations: {
                feature: true
            },
            where: {
                user: {id: userId}
            }
        })
    }

    async activateUserFeature(id: string) {
        await this.featureUserRepository.update(id, {
            isActive: true
        })
    }

    async deactivateUserFeature(id: string) {
        await this.featureUserRepository.update(id, {
            isActive: false
        })
    }
}
