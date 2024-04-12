import {
  Controller,
  Patch,
  Param,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Get,
  Post,
  Put,
  Req,
  Body,
  ClassSerializerInterceptor,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { BankAccountDto } from './dto/banks.account.dto';
import { PreferenceDto } from './dto/preference.dto';
import { ProfilePictureDto } from './dto/profilePicture.dto';
import { MeService } from './me.service';
import { AuthUser } from '../auth/payloads/auth.payload';
import { UpdateUsernameDto } from './dto/updateUsername.dto';
import { EditEmailDto } from './dto/editEmail.dto';
import { EditMobileDto } from './dto/editMobile.dto';
import { UpdateResidenceDto } from './dto/residence-update.dto';
import { User } from 'src/common/decorators/user.decorator';
import { UsersService } from '../users/users.service';

@UseGuards(AccessTokenGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('me')
export class MeController {
  constructor(
    private meService: MeService,
    private userService: UsersService
  ) {}

  @Get('/residence')
  getResidenceChanged(@User() user: AuthUser) {
    return this.userService.getResidenceChange(user)
  }

  @Patch('/residence')
  updateResidence(@User() user: AuthUser,@Req() req: Request,@Body() data: UpdateResidenceDto) {
    return this.userService.updateResidence(user.sub,data)
  }

  @Patch('/mobile')
  updatePhone(@Req() req: Request,@Body() data: EditMobileDto) {
    return this.meService.updatePhone(req.user as AuthUser,data)
  }

  @Delete('/')
  deleteAccount(@Req() req: Request) {
    return this.meService.deleteOsmoAccount(req.user as AuthUser)
  }

  @Patch('/email')
  updateEmail(@Req() req: Request, @Body() data: EditEmailDto) {
    return this.meService.updateEmail(req.user as AuthUser, data);
  }

  @Patch('/username')
  updateUsername(@Req() req: Request, @Body() data: UpdateUsernameDto) {
    return this.meService.updateUsername(req.user as AuthUser, data);
  }

  @Get()
  async getProfile(@Req() req: Request) {
    const authUser: AuthUser = {
      sub: req.user['sub'],
    };
    return this.meService.getProfile(authUser);
  }

  @Patch('profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  updateProfilePicture(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body() data: ProfilePictureDto,
  ) {
    const authUser: AuthUser = {
      sub: req.user['sub'],
    };
    return this.meService.updateProfilePicture(authUser, file, data);
  }

  @Post('bank-accounts')
  createBankAccount(@Req() req: Request, @Body() data: BankAccountDto) {
    const authUser: AuthUser = {
      sub: req.user['sub'],
    };
    return this.meService.createBankAccount(authUser, data);
  }

  @Get('bank-accounts')
  getBankAccounts(@Req() req: Request) {
    const authUser: AuthUser = {
      sub: req.user['sub'],
    };
    return this.meService.getBankAccounts(authUser);
  }

  @Put('bank-accounts/:id')
  updatebankAccount(
    @Req() req: Request,
    @Body() data: BankAccountDto,
    @Param() param,
  ) {
    const authUser: AuthUser = {
      sub: req.user['sub'],
    };
    const bankId = param.id;
    return this.meService.updateBankAccount(authUser, data, bankId);
  }

  @Delete('bank-accounts/:id')
  deleteBankAccount(@Req() req: Request, @Param() param) {
    const authUser: AuthUser = {
      sub: req.user['sub'],
    };
    const bankId = param.id;
    return this.meService.deleteBankAccount(authUser, bankId);
  }

  @Get('wallets')
  getWallets(@Req() req: Request) {
    const authUser: AuthUser = {
      sub: req.user['sub'],
    };
    return this.meService.getWallets(authUser);
  }

  @Get('preferences')
  getPreferences(@Req() req: Request) {
    const authUser: AuthUser = {
      sub: req.user['sub'],
    };
    return this.meService.getPreferences(authUser);
  }

  @Put('preferences')
  updatePreferences(@Req() req: Request, @Body() data: PreferenceDto) {
    const authUser: AuthUser = {
      sub: req.user['sub'],
    };
    return this.meService.updatePreference(authUser, data);
  }

  @Get('recent-contacts')
  getRecentContacts(@Req() req: Request) {
    const authUser: AuthUser = {
      sub: req.user['sub'],
    };
    return this.meService.getRecentContacts(authUser);
  }
}
