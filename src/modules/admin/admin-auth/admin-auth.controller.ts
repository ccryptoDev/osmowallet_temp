import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AuthUser } from 'src/modules/auth/payloads/auth.payload';
import { Request } from 'express';
import { AdminRefreshTokenGuard } from './guards/refreshToken.guard';
import { GrantType } from 'src/modules/auth/enums/granTypes.enum';
import { AdminAuthDto } from './dtos/adminauth.dto';
import { AdminAccessTokenGuard } from './guards/accessToken.guard';
import { User } from 'src/common/decorators/user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('admin/auth')
@ApiTags('Admin Authentication')
export class AdminAuthController {
    constructor(private adminAuthService: AdminAuthService) {}

    @Post('signin')
    @ApiOperation({ summary: 'Sign in with passkey or email and password' })
    signin(@Req() req: Request, @Body() data: AdminAuthDto) {
        if (req.headers.authorization) {
            return this.adminAuthService.signinWithPasskey(req, data);
        }
        return this.adminAuthService.signinWithEmailAndPassword(data);
    }

    @UseGuards(AdminRefreshTokenGuard)
    @Post('refresh-token')
    @ApiOperation({ summary: 'Refresh access and refresh tokens' })
    @ApiBearerAuth()
    refreshTokens(@User() user: AuthUser, @Body() data: AdminAuthDto) {
        if (data.grantType != GrantType.RefreshToken) throw new UnauthorizedException();
        return this.adminAuthService.refreshTokens(user, data);
    }

    @UseGuards(AdminAccessTokenGuard)
    @Post('2fa/active')
    @ApiOperation({ summary: 'Activate 2FA' })
    @ApiBearerAuth()
    active2FA(@User() user: AuthUser) {
        return this.adminAuthService.activate2FA(user);
    }

    @UseGuards(AdminAccessTokenGuard)
    @Post('2fa/deactive')
    @ApiOperation({ summary: 'Deactivate 2FA' })
    @ApiBearerAuth()
    deactive2FA(@User() user: AuthUser) {
        return this.adminAuthService.deactivate2FA(user);
    }
}
