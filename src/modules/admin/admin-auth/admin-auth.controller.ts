import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AuthUser } from 'src/modules/auth/payloads/auth.payload';
import { Request } from 'express';
import { AdminRefreshTokenGuard } from './guards/refreshToken.guard';
import { GrantType } from 'src/modules/auth/enums/granTypes.enum';
import { AdminAuthDto } from './dtos/adminauth.dto';
import { AdminAccessTokenGuard } from './guards/accessToken.guard';
import { User } from 'src/common/decorators/user.decorator';


@Controller('admin/auth')
export class AdminAuthController {
    
    constructor(private adminAuthService: AdminAuthService){}

    @Post('signin')
    signin(@Req() req: Request, @Body() data: AdminAuthDto){
        if(req.headers.authorization){
            return this.adminAuthService.signinWithPasskey(req,data)
        }
        return this.adminAuthService.signinWithEmailAndPassword(data)
    }
    
    @UseGuards(AdminRefreshTokenGuard)
    @Post('refresh-token')
    refreshTokens(@Req() req: Request, @Body() data: AdminAuthDto) {
        if(data.grantType != GrantType.RefreshToken) throw new UnauthorizedException()
        const authUser: AuthUser = {sub: req.user['sub']}
        return this.adminAuthService.refreshTokens(authUser,data);
    }

    @UseGuards(AdminAccessTokenGuard)
    @Post('2fa/active')
    active2FA(@User() user: AuthUser) {
        return this.adminAuthService.activate2FA(user);
    }

    @UseGuards(AdminAccessTokenGuard)
    @Post('2fa/deactive')
    deactive2FA(@User() user: AuthUser) {
        return this.adminAuthService.deactivate2FA(user);
    }


}
