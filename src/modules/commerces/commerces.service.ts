import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model } from 'mongoose';
import { RedisService } from 'src/common/services/redis/redis.service';
import { Commerce } from 'src/schemas/commerce.schema';
import { CommerceVersion } from 'src/schemas/commercesVersion.schema';
import { GetCommerceDto } from './dtos/getCommerce.dto';
import { NearestCommerceDto } from './dtos/nearestCommerces.dto';

@Injectable()
export class CommercesService {
    private readonly logger = new Logger(CommercesService.name);

    constructor(
        @InjectModel(Commerce.name) private commerceModel: Model<Commerce>,
        @InjectModel(CommerceVersion.name)
        private commerceVersionModel: Model<CommerceVersion>,
        private redisService: RedisService,
    ) {}

    async getBTCMAPData() {
        const config = {
            baseURL: 'https://api.btcmap.org/v2/elements',
            method: 'GET',
        };
        const response = await axios(config);
        const data: any[] = response.data;
        const dataFiltered = data.filter((item) => {
            if (item['id'].toString().includes('node:')) {
                if (item['osm_json']['lat'] > 90 || item['osm_json']['lat'] < -90) return false;
                if (item['osm_json']['lon'] > 180 || item['osm_json']['long'] < -180) return false;
                return true;
            }
            return false;
        });
        const dataTransformed = dataFiltered.map((item) => {
            return {
                ...item,
                osm_json: {
                    ...item.osm_json,
                    location: {
                        type: 'Point',
                        coordinates: [item.osm_json.lon, item.osm_json.lat],
                    },
                },
                tagsString: JSON.stringify(item['osm_json']['tags']),
                deleted_at: item['deleted_at'] === '' ? null : item['deleted_at'],
                updated_at: item['updated_at'] === '' ? null : item['updated_at'],
            };
        });
        return dataTransformed;
    }

    async getCommercesVersion() {
        try {
            const response = await this.commerceVersionModel.find();
            return response[0];
        } catch (error) {
            if (error instanceof Error) this.logger.error(`Error getting commerce version: ${error.message}`);
            throw new BadRequestException('Error getting commerce version');
        }
    }

    async updateCommerces() {
        const btcMapData = await this.getBTCMAPData();
        await this.commerceModel.deleteMany();
        const chunkSize = 2000;
        const commerceChunks = [];
        for (let i = 0; i < btcMapData.length; i += chunkSize) {
            commerceChunks.push(btcMapData.slice(i, i + chunkSize));
        }
        await Promise.all(commerceChunks.map((commerceChunk) => this.commerceModel.insertMany(commerceChunk)));
        const [commerceVersion] = await this.commerceVersionModel.find();
        if (commerceVersion) {
            const version = commerceVersion.version + 1;
            await this.commerceVersionModel.updateOne({}, { version });
        } else {
            await this.commerceVersionModel.create({ version: 1 });
        }
        this.updateCacheCommerces();
    }

    async updateCacheCommerces() {
        const allCommerces = await this.commerceModel.find({}, { 'osm_json.tagsString': 0 });
        await this.redisService.setKeyValue('commerces', JSON.stringify(allCommerces));
        const commercesStringified = JSON.stringify(allCommerces);
        return commercesStringified;
    }

    async getAllCommerces() {
        let commercesStringified = await this.redisService.getKeyValue('commerces');
        if (!commercesStringified) {
            commercesStringified = await this.updateCacheCommerces();
        }
        return JSON.parse(commercesStringified);
    }

    async findCommerces(query: GetCommerceDto) {
        if (query.query == undefined) {
            return await this.getAllCommerces();
        }
        const page = query.page || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const commerces = await this.commerceModel.aggregate([
            {
                $search: {
                    index: 'default',
                    text: {
                        query: query.query,
                        path: {
                            wildcard: '*',
                        },
                    },
                },
            },
            {
                $project: {
                    osm_json: {
                        tagsString: 0,
                    },
                },
            },
            { $skip: skip },
            { $limit: limit },
        ]);
        return commerces;
    }

    async getNearestCommerces(query: NearestCommerceDto) {
        try {
            const commerces = await this.commerceModel.aggregate([
                {
                    $geoNear: {
                        near: {
                            type: 'Point',
                            coordinates: [Number(query.lon), Number(query.lat)],
                        },
                        distanceField: 'dist.calculated',
                        maxDistance: query.radius,
                        spherical: true,
                    },
                },
                {
                    $project: {
                        osm_json: {
                            tagsString: 0,
                        },
                    },
                },
            ]);
            return commerces;
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Failed to get nearest commerces: ${error.message}`);
                throw new BadRequestException(`Failed to get nearest commerces: ${error.message}`);
            }
            throw new BadRequestException('Failed to get nearest commerces');
        }
    }
}
