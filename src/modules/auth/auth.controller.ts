import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
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
<<<<<<< HEAD
import { HowFindoutUsDto } from './dto/howFindoutUs.dto';
=======
import { HowKnowoutDto } from './dto/howKnowOut.dto';
>>>>>>> dev

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/create-usauser')
  createUsaUser(@Body() body: CreateUsaUserDto) {
    return this.authService.createUsaUser(body)
  }


  @UseGuards(AccessTokenGuard)
  @Get('/pin')
  hasPin(@Req() req: Request) {
    return this.authService.checkHasPin(req.user as AuthUser)
  }

  @Post('/input/send-verification')
  sendInputVerification(@Body() data: InputDto){
    return this.authService.sendInputVerification(data)
  }

  @Post('/input/verify')
  verifyInputVerification(@Body() data: SignupOtpDto){
    return this.authService.verifyInputVerification(data)
  }

  @UseGuards(AccessTokenGuard)
  @Post('/pin/verify')
  verifyPin(@Req() req: Request, @Body() data: PinDto) {
    return this.authService.verifyPin(req.user as AuthUser, data);
  }

  @UseGuards(AccessTokenGuard)
  @Post('/pin')
  createPin(@Req() req: Request, @Body() data: PinDto) {
    return this.authService.createPin(req.user as AuthUser, data);
  }

  @Get('/validate-email')
  validateEmail(@Query() query: VerifyEmailValid) {
    return this.authService.verifyEmailValid(query);
  }

  @UseGuards(AccessTokenGuard)
  @Patch('/session')
  updateLastSession(@Req() req: Request) {
    return this.authService.updateLastSession(req.user as AuthUser);
  }

  @Post('signup')
  signup(@Body() createUserDto: SignUpDto) {
    return this.authService.signUp(createUserDto);
  }

  @Post('signin')
  signin(@Body() data: any) {
    return this.authService.signIn(data);
  }

  @Post('how-find-out')
  howFindoutUs(@Body() data: HowFindoutUsDto) {
    return this.authService.howFindoutUs(data);
  }

  @Post('signin/verify-otp')
  verifyAuthOTP(@Body() data: AuthOTPDto) {
    return this.authService.verifyAuthOTP(data);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('logout')
  logout(@Req() req: Request) {
    const refreshToken = req.get('Authorization').replace('Bearer', '').trim();
    const authUser: AuthUser = { sub: req.user['sub'] };
    this.authService.logout(authUser, refreshToken);
  }

  @UseGuards(SessionLogoutAllTokenGuard)
  @Post('logout-all')
  logoutAll(@Req() req: Request) {
    this.authService.logoutAll(req.user['sub']);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('session')
  storeSession(@Body() data: SessionDto, @Req() req: Request) {
    const refreshToken = req.get('Authorization').replace('Bearer', '').trim();
    const authUser: AuthUser = { sub: req.user['sub'] };
    this.authService.storeSession(authUser, data, refreshToken);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh-token')
  refreshTokens(@Req() req: Request, @Body() data: AuthDto) {
    const authUser: AuthUser = { sub: req.user['sub'] };
    const refreshToken = req.user['refreshToken'];
    return this.authService.refreshTokens(authUser, refreshToken, data);
  }

  @UseGuards(AccessTokenGuard)
  @Post('send-email-verification')
  sendEmailVerification(@Req() req: Request) {
    const authUser: AuthUser = { sub: req.user['sub'] };
    this.authService.sendEmailVerification(authUser);
  }

  @UseGuards(AccessTokenGuard)
  @Post('verify-email-verification')
  verifyEmailVerification(@Req() req: Request, @Body() data: OtpDto) {
    const authUser: AuthUser = { sub: req.user['sub'] };
    return this.authService.verifyEmail(authUser,data);
  }

  @UseGuards(AccessTokenGuard)
  @Post('send-mobile-verification')
  sendMobileVerification(@Req() req: Request) {
    const authUser: AuthUser = { sub: req.user['sub'] };
    return this.authService.sendMobileVerification(authUser);
  }

  @UseGuards(AccessTokenGuard)
  @Post('verify-mobile-verification')
  verifyMobileVerification(@Req() req: Request, @Body() data: OtpDto) {
    const authUser: AuthUser = { sub: req.user['sub'] };
    return this.authService.verifyMobile(authUser, data.otp);
  }

}
