import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CreateOsmoBusinessDto } from './dtos/createOsmoBusiness.dto';
import { OsmoBusinessService } from './osmo-business.service';
import { GetOsmoBusinessDto } from './dtos/getOsmoBusiness.dto';
import { AdminAccessTokenGuard } from '../admin-auth/guards/accessToken.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Osmo Business')
@ApiBearerAuth()
@UseGuards(AdminAccessTokenGuard)
@Controller('admin/osmo-business')
export class OsmoBusinessController {
    constructor(private osmoBusinessService: OsmoBusinessService) {}

    @ApiOperation({ summary: 'Create an Osmo Business' })
    @Post()
    createOsmoBusiness(@Body() body: CreateOsmoBusinessDto) {
        return this.osmoBusinessService.createOsmoBusiness(body);
    }

    @ApiOperation({ summary: 'Get Osmo Businesses' })
    @Get()
    getOsmoBusinessBpts(@Query() query: GetOsmoBusinessDto) {
        return this.osmoBusinessService.getOsmoBusinesses(query);
    }

    @ApiOperation({ summary: 'Delete an Osmo Business' })
    @Delete('/:id')
    deleteOsmoBusinessBpt(@Param('id') id: string) {
        return this.osmoBusinessService.deleteOsmoBusiness(id);
    }

    @ApiOperation({ summary: 'Update an Osmo Business' })
    @Put('/:id')
    updateOsmoBusinessBpt(@Param('id') id: string, @Body() body: CreateOsmoBusinessDto) {
        return this.osmoBusinessService.updateOsmoBusiness(id, body);
    }
}
