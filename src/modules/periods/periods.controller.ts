import { Controller, UseGuards, Get, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { PeriodsService } from './periods.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Periods')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('periods')
export class PeriodsController {
    constructor(private periodService: PeriodsService) {}

    @ApiOperation({ summary: 'Get all periods' })
    @Get()
    getPeriods() {
        return this.periodService.getPeriods();
    }
}
