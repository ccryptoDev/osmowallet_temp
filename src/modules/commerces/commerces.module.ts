import { Module } from '@nestjs/common';
import { CommercesService } from './commerces.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Commerce, CommerceSchema, } from 'src/schemas/commerce.schema';
import { CommercesController } from './commerces.controller';
import { RedisService } from 'src/common/services/redis/redis.service';
import { CommerceVersion, CommerceVersionSchema } from 'src/schemas/commercesVersion.schema';

@Module({
  imports: [

    MongooseModule.forFeature([
      {name: Commerce.name, schema: CommerceSchema},
      {name: CommerceVersion.name, schema: CommerceVersionSchema},
    ])
  ],
  providers: [CommercesService,RedisService],
  exports: [CommercesService],
  controllers: [CommercesController]
})
export class CommercesModule {}
