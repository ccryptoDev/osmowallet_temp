import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Feature } from 'src/entities/feature.entity';
import { TierFeature } from 'src/entities/tierFeature.entity';
import { TierUser } from 'src/entities/tierUser.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/payloads/auth.payload';

@Injectable()
export class FeaturesService {
    constructor(
        @InjectRepository(Feature) private featureRepository: Repository<Feature>,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(TierUser) private tierUserRepository: Repository<TierUser>,
        @InjectRepository(TierFeature) private tierFeatureRepository: Repository<TierFeature>,
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
        return features.map((feature) => {
            const available = feature.countries.some((country) => country.country.code === user?.nationality);
            const { id, name, isActive } = feature;
            const platforms = feature.platforms.map((platform) => ({ isActive: platform.active, platform: platform.platform }));
            return { id: id, name, platforms, isActive, availableCountry: available };
        });
    }
}
