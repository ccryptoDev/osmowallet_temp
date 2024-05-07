import { Module } from '@nestjs/common';
import { AdminMeController } from './admin-me.controller';
import { MeModule } from 'src/modules/me/me.module';

@Module({
    imports: [MeModule],
    controllers: [AdminMeController],
})
export class AdminMeModule {}
