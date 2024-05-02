import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisService } from 'src/common/services/redis/redis.service';
import { Commerce, CommerceSchema } from 'src/schemas/commerce.schema';
import { CommerceVersion, CommerceVersionSchema } from 'src/schemas/commercesVersion.schema';
import { CommercesController } from './commerces.controller';
import { CommercesService } from './commerces.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Commerce.name, schema: CommerceSchema },
            { name: CommerceVersion.name, schema: CommerceVersionSchema },
        ]),
    ],
    providers: [CommercesService, RedisService],
    exports: [CommercesService],
    controllers: [CommercesController],
})
export class CommercesModule {}
