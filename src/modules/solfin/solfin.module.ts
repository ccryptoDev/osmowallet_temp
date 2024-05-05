import { Module, forwardRef } from '@nestjs/common';
import { SolfinController } from './solfin.controller';
import { SolfinService } from './solfin.service';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SolfinAccount, SolfinAccountSchema } from 'src/schemas/solfinAccount.schema';
import { KycModule } from '../kyc/kyc.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
    ]),
    MongooseModule.forFeature([
      {name: SolfinAccount.name, schema: SolfinAccountSchema}
    ]),
    forwardRef(() => KycModule)
  ],
  controllers: [SolfinController],
  providers: [SolfinService, GoogleCloudTasksService],
  exports: [SolfinService]
})
export class SolfinModule {}
