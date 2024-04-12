import { Body, ClassSerializerInterceptor, Controller, Get, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { CheckUserByUsername } from './dtos/checkByUsername.dto';
import { CheckUserDto } from './dtos/checkUser.dto';
import { UserDto } from './dtos/user.dto';
import { UsersService } from './users.service';
import { UpdateResidenceDto } from '../me/dto/residence-update.dto';
import { User } from 'src/common/decorators/user.decorator';
import { AuthUser } from '../auth/payloads/auth.payload';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {

    constructor(private userService: UsersService){}

    @Get('/validate-username')
    async checkUserByUsername(@Query() query: CheckUserByUsername){
        return this.userService.checkUserByUsername(query)
    }

    @UseGuards(AccessTokenGuard)
    @Get()
    async getUsers(@Query() params: UserDto){
        return this.userService.getUsers(params)        
    }

    @UseGuards(AccessTokenGuard)
    @Post('check')
    async checkUsers(@Body() data: CheckUserDto) {
        return this.userService.checkUserRegistered(data)
    }

    @UseGuards(AccessTokenGuard)
    @Patch()
    async updateResidence(@User() authUser: AuthUser, @Body() body: UpdateResidenceDto) {
        return this.userService.updateResidence(authUser.sub, body)
    }
    
}
