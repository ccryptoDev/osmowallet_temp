import { Module } from '@nestjs/common';
import { StillmanController } from './stillman.controller';
import { StillmanService } from './stillman.service';

@Module({
    controllers: [StillmanController],
    providers: [StillmanService],
    exports: [StillmanService],
})
export class StillmanModule {}
