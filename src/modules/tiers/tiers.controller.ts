import { ClassSerializerInterceptor, Controller, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';

@ApiTags('tiers')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('tiers')
export class TiersController {}
