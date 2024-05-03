import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@ApiBearerAuth()
@Controller()
export class AppController {}
