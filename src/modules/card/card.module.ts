import { Module } from '@nestjs/common';
import { CardController } from './card.controller';
import { CardService } from './card.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OnvoPaymentMethod, OnvoPaymentMethodSchema } from 'src/schemas/card.schema';
import { UserCard, UserCardSchema } from 'src/schemas/userCard.schema';
import { OnvoService } from 'src/services/onvo/onvo.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: OnvoPaymentMethod.name, schema: OnvoPaymentMethodSchema},
      {name: UserCard.name, schema: UserCardSchema}
    ]),
    UsersModule
  ],
  controllers: [CardController],
  providers: [CardService,OnvoService],
  exports: [CardService]
})
export class CardModule {}
