import { Body, ClassSerializerInterceptor, Controller, Get, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { CheckUserByUsername } from './dtos/checkByUsername.dto';
import { CheckUserDto } from './dtos/checkUser.dto';
import { UserDto } from './dtos/user.dto';
import { UsersService } from './users.service';
import { UpdateResidenceDto } from '../me/dto/residence-update.dto';
import { User } from 'src/common/decorators/user.decorator';
import { AuthUser } from '../auth/payloads/auth.payload';

@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private userService: UsersService) {}

    @ApiOperation({ summary: 'Check user by username' })
    @Get('/validate-username')
    async checkUserByUsername(@Query() query: CheckUserByUsername) {
        return this.userService.checkUserByUsername(query);
    }

    @UseGuards(AccessTokenGuard)
    @ApiOperation({ summary: 'Get users' })
    @Get()
    async getUsers(@Query() params: UserDto) {
        return this.userService.getUsers(params);
    }

    @UseGuards(AccessTokenGuard)
    @ApiOperation({ summary: 'Check users' })
    @Post('check')
    async checkUsers(@Body() data: CheckUserDto) {
        return this.userService.checkUserRegistered(data);
    }

    @UseGuards(AccessTokenGuard)
    @ApiOperation({ summary: 'Update residence' })
    @ApiBearerAuth()
    @Patch()
    async updateResidence(@User() authUser: AuthUser, @Body() body: UpdateResidenceDto) {
        return this.userService.updateResidence(authUser.sub, body);
    }
}
