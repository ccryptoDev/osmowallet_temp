import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OsmoBusinessBpt } from 'src/entities/osmoBusinessBPT.entity';
import { Like, Repository } from 'typeorm';
import { CreateOsmoBusinessDto } from './dtos/createOsmoBusiness.dto';
import { GoogleCloudStorageService } from 'src/services/google-cloud-storage/google-cloud-storage.service';
import { GetOsmoBusinessDto } from './dtos/getOsmoBusiness.dto';

@Injectable()
export class OsmoBusinessService {
    constructor(
        @InjectRepository(OsmoBusinessBpt) private osmoBusinessRepository: Repository<OsmoBusinessBpt>,
        private googleCloudStorageService: GoogleCloudStorageService,
    ) {}

    private async saveOsmoBusinessLogo(fileName: string, osmoBusiness: OsmoBusinessBpt, image: Array<number>) {
        const buffer = Buffer.from(image);
        const multerFile = {
            fieldname: 'logo',
            originalname: 'logo.jpeg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            buffer: buffer,
            size: buffer.length,
        } as Express.Multer.File;
        const path = `${fileName}.jpeg`;
        await this.googleCloudStorageService.saveFile(multerFile, path, 'osmo-bpts', true);
        osmoBusiness.logo = this.googleCloudStorageService.getPublicUrl('osmo-bpts', path);
    }

    async updateOsmoBusiness(id: string, body: CreateOsmoBusinessDto) {
        const { name, bptName, url, image } = body;
        const osmoBusiness = await this.osmoBusinessRepository.findOneBy({ id: id });

        if (!osmoBusiness) {
            throw new BadRequestException('Invalid osmo business');
        }

        osmoBusiness.name = name;
        osmoBusiness.bptName = bptName;
        osmoBusiness.url = url;
        if (image) {
            await this.saveOsmoBusinessLogo(bptName, osmoBusiness, image);
        }
        await this.osmoBusinessRepository.save(osmoBusiness);
        return osmoBusiness;
    }

    async deleteOsmoBusiness(id: string) {
        const osmoBusiness = await this.osmoBusinessRepository.findOneBy({ id: id });
        if (!osmoBusiness) throw new BadRequestException('Invalid osmo business');
        await this.osmoBusinessRepository.remove(osmoBusiness);
    }

    async createOsmoBusiness(body: CreateOsmoBusinessDto) {
        const { name, bptName, url, image } = body;
        const osmoBusiness = this.osmoBusinessRepository.create({ name, bptName, url });
        if (image) {
            await this.saveOsmoBusinessLogo(bptName, osmoBusiness, image);
        }

        await this.osmoBusinessRepository.save(osmoBusiness);
        return osmoBusiness;
    }

    async getOsmoBusinesses(query: GetOsmoBusinessDto) {
        const { page, query: searchQuery } = query;
        const take = 10;
        const skip = (page - 1) * take;

        const [osmoBusinesses, total] = await this.osmoBusinessRepository.findAndCount({
            where: searchQuery ? { name: Like(`%${searchQuery}%`) } : undefined,
            take,
            skip,
        });

        return {
            data: osmoBusinesses,
            total,
            page,
        };
    }
}
