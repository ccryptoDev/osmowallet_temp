import { Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { CommercesService } from './commerces.service';
import { GetCommerceDto } from './dtos/getCommerce.dto';
import { NearestCommerceDto } from './dtos/nearestCommerces.dto';

@ApiTags('Commerces')
@Controller('commerces')
export class CommercesController {
    constructor(private commerceService: CommercesService) {}

    @ApiOperation({ summary: 'Update commerces' })
    @Put()
    updateCommerces() {
        this.commerceService.updateCommerces();
    }

    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get commerce version' })
    @UseGuards(AccessTokenGuard)
    @Get('/version')
    getCommerceVersion() {
        return this.commerceService.getCommercesVersion();
    }

    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get commerces' })
    @UseGuards(AccessTokenGuard)
    @Get()
    getCommerces(@Query() query: GetCommerceDto) {
        return this.commerceService.findCommerces(query);
    }

    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get nearest commerces' })
    @UseGuards(AccessTokenGuard)
    @Get('/nearest')
    getNearestCommerces(@Query() query: NearestCommerceDto) {
        return this.commerceService.getNearestCommerces(query);
    }
}
