import { Module } from '@nestjs/common';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { App } from 'src/entities/app.entity';
import { JwtService } from '@nestjs/jwt';
import { AdminRefreshTokenStrategy } from './strategies/refreshToken.strategy';
import { AdminAccessTokenStrategy } from './strategies/accessToken.strategy';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [TypeOrmModule.forFeature([User, App]), ConfigModule],
    controllers: [AdminAuthController],
    providers: [AdminAuthService, JwtService, AdminRefreshTokenStrategy, AdminAccessTokenStrategy],
})
export class AdminAuthModule {}
