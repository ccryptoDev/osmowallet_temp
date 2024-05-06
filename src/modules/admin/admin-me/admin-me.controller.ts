import { ClassSerializerInterceptor, Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { MeService } from 'src/modules/me/me.service';
import { AdminAccessTokenGuard } from '../admin-auth/guards/accessToken.guard';
import { User } from 'src/common/decorators/user.decorator';
import { AuthUser } from 'src/modules/auth/payloads/auth.payload';

@UseGuards(AdminAccessTokenGuard)
@Controller('admin/me')
export class AdminMeController {
    constructor(
        private meService: MeService,
    ){}
    
    @UseInterceptors(ClassSerializerInterceptor)
    @Get('')
    getProfile(@User() user: AuthUser){
        return this.meService.getProfile(user)
    }
}
