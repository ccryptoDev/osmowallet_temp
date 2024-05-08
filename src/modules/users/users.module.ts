import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Bank } from 'src/entities/bank.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { ResidenceChange, ResidenceChangeSchema } from 'src/schemas/residence-change.schema';
import { AlgoliaService } from 'src/services/algolia/algolia.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: ResidenceChange.name, schema: ResidenceChangeSchema }]),
        TypeOrmModule.forFeature([User, Bank]),
    ],
    providers: [UsersService, AlgoliaService],
    controllers: [UsersController],
    exports: [UsersService],
})
export class UsersModule {}
