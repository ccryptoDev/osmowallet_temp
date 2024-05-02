import { ClassSerializerInterceptor, Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { MeService } from 'src/modules/me/me.service';
import { AdminAccessTokenGuard } from '../admin-auth/guards/accessToken.guard';
import { User } from 'src/common/decorators/user.decorator';
import { AuthUser } from 'src/modules/auth/payloads/auth.payload';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Admin')
@Controller('admin/me')
export class AdminMeController {
    constructor(private meService: MeService) {}

    @UseGuards(AdminAccessTokenGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    @ApiOperation({ summary: 'Get the profile of the authenticated admin user' })
    @ApiBearerAuth()
    @Get('')
    getProfile(@User() user: AuthUser) {
        return this.meService.getProfile(user);
    }
}
