import { Body, ClassSerializerInterceptor, Controller, Get, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { User } from 'src/common/decorators/user.decorator';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { AuthUser } from '../auth/payloads/auth.payload';
import { AutoconvertService } from './autoconvert.service';
import { AutoConvertDto } from './dtos/autoconvert.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@UseGuards(AccessTokenGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('autoconvert')
@Controller('autoconvert')
export class AutoconvertController {
    constructor(private autoconvertService: AutoconvertService) {}

    @Get('')
    @ApiOperation({ summary: 'Get autoconvert data' })
    @ApiBearerAuth()
    getAutoConvert(@User() user: AuthUser) {
        return this.autoconvertService.getAutoConvert(user);
    }

    @Post('')
    @ApiOperation({ summary: 'Update autoconvert data' })
    @ApiBearerAuth()
    updateAutoconvert(@User() user: AuthUser, @Body() data: AutoConvertDto) {
        return this.autoconvertService.updateAutoconvert(user, data);
    }
}
