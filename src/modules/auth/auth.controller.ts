import { BadRequestException, Body, Controller, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { RefreshTokenGuard } from 'src/modules/auth/guards/refreshToken.guard';
import { SessionLogoutAllTokenGuard } from 'src/modules/auth/guards/sessionLogoutAllToken.guard';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { AuthOTPDto } from './dto/authOtp.dto';
import { InputDto } from './dto/input.dto';
import { OtpDto } from './dto/otp.dto';
import { PinDto } from './dto/pin.dto';
import { SessionDto } from './dto/session.dto';
import { SignUpDto } from './dto/signup.dto';
import { SignupOtpDto } from './dto/signupOtp.dto';
import { CreateUsaUserDto } from './dto/usaUser.dto';
import { VerifyEmailValid } from './dto/verifyEmailValid.dto';
import { AuthUser } from './payloads/auth.payload';
import { User } from 'src/common/decorators/user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HowFindoutUsDto } from './dto/howFindoutUs.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('/create-usauser')
    @ApiOperation({ summary: 'Create USA user' })
    createUsaUser(@Body() body: CreateUsaUserDto) {
        return this.authService.createUsaUser(body);
    }

    @UseGuards(AccessTokenGuard)
    @Get('/pin')
    @ApiOperation({ summary: 'Check if user has PIN' })
    hasPin(@Req() req: Request) {
        return this.authService.checkHasPin(req.user as AuthUser);
    }

    @Post('/input/send-verification')
    @ApiOperation({ summary: 'Send input verification' })
    sendInputVerification(@Body() data: InputDto) {
        return this.authService.sendInputVerification(data);
    }

    @Post('/input/verify')
    @ApiOperation({ summary: 'Verify input verification' })
    verifyInputVerification(@Body() data: SignupOtpDto) {
        return this.authService.verifyInputVerification(data);
    }

    @UseGuards(AccessTokenGuard)
    @Post('/pin/verify')
    @ApiOperation({ summary: 'Verify PIN' })
    verifyPin(@Req() req: Request, @Body() data: PinDto) {
        return this.authService.verifyPin(req.user as AuthUser, data);
    }

    @UseGuards(AccessTokenGuard)
    @Post('/pin')
    @ApiOperation({ summary: 'Create PIN' })
    createPin(@Req() req: Request, @Body() data: PinDto) {
        return this.authService.createPin(req.user as AuthUser, data);
    }

    @Get('/validate-email')
    @ApiOperation({ summary: 'Validate email' })
    validateEmail(@Query() query: VerifyEmailValid) {
        return this.authService.verifyEmailValid(query);
    }

    @UseGuards(AccessTokenGuard)
    @Patch('/session')
    @ApiOperation({ summary: 'Update last session' })
    updateLastSession(@Req() req: Request) {
        return this.authService.updateLastSession(req.user as AuthUser);
    }

    @Post('signup')
    @ApiOperation({ summary: 'Sign up' })
    signup(@Body() createUserDto: SignUpDto) {
        return this.authService.signUp(createUserDto);
    }

    @Post('signin')
    @ApiOperation({ summary: 'Sign in' })
    signin(@Body() data: any) {
        return this.authService.signIn(data);
    }

    @Post('how-find-out')
    howFindoutUs(@Body() data: HowFindoutUsDto) {
        return this.authService.howFindoutUs(data);
    }

    @Post('signin/verify-otp')
    @ApiOperation({ summary: 'Verify OTP for authentication' })
    verifyAuthOTP(@Body() data: AuthOTPDto) {
        return this.authService.verifyAuthOTP(data);
    }

    @UseGuards(RefreshTokenGuard)
    @Post('logout')
    @ApiOperation({ summary: 'Logout' })
    @ApiBearerAuth()
    logout(@Req() req: Request, @User() user: AuthUser) {
        const refreshToken = req.get('Authorization')?.replace('Bearer', '').trim();
        if (!refreshToken) throw new BadRequestException('Refresh token not found');

        this.authService.logout(user, refreshToken);
    }

    @UseGuards(SessionLogoutAllTokenGuard)
    @Post('logout-all')
    @ApiOperation({ summary: 'Logout from all sessions' })
    @ApiBearerAuth()
    logoutAll(@User() user: AuthUser) {
        this.authService.logoutAll(user);
    }

    @UseGuards(RefreshTokenGuard)
    @Post('session')
    @ApiOperation({ summary: 'Store session' })
    @ApiBearerAuth()
    storeSession(@Body() data: SessionDto, @User() user: AuthUser, @Req() req: Request) {
        const refreshToken = req.get('Authorization')?.replace('Bearer', '').trim();
        if (!refreshToken) throw new BadRequestException('Refresh token not found');
        this.authService.storeSession(user, data, refreshToken);
    }

    @UseGuards(RefreshTokenGuard)
    @Post('refresh-token')
    @ApiOperation({ summary: 'Refresh tokens' })
    @ApiBearerAuth()
    refreshTokens(@Req() req: Request, @Body() data: AuthDto, @User() user: AuthUser) {
        const refreshToken = req.user?.['refreshToken' as keyof Request['user']];
        if (!refreshToken) throw new BadRequestException('Refresh token not found');

        return this.authService.refreshTokens(user, refreshToken, data);
    }

    @UseGuards(AccessTokenGuard)
    @Post('send-email-verification')
    @ApiOperation({ summary: 'Send email verification' })
    sendEmailVerification(@User() user: AuthUser) {
        this.authService.sendEmailVerification(user);
    }

    @UseGuards(AccessTokenGuard)
    @Post('verify-email-verification')
    @ApiOperation({ summary: 'Verify email verification' })
    verifyEmailVerification(@User() user: AuthUser, @Body() data: OtpDto) {
        return this.authService.verifyEmail(user, data);
    }

    @UseGuards(AccessTokenGuard)
    @Post('send-mobile-verification')
    @ApiOperation({ summary: 'Send mobile verification' })
    sendMobileVerification(@User() user: AuthUser) {
        return this.authService.sendMobileVerification(user);
    }

    @UseGuards(AccessTokenGuard)
    @Post('verify-mobile-verification')
    @ApiOperation({ summary: 'Verify mobile verification' })
    verifyMobileVerification(@User() user: AuthUser, @Body() data: OtpDto) {
        return this.authService.verifyMobile(user, data.otp);
    }
}
