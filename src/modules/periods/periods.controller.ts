import { Controller,UseGuards,Get,UseInterceptors,ClassSerializerInterceptor } from '@nestjs/common';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { PeriodsService } from './periods.service';

@UseGuards(AccessTokenGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('periods')
export class PeriodsController {
    constructor(private periodService: PeriodsService){}


    @Get()
    getPeriods(){
        return this.periodService.getPeriods()
    }
}
