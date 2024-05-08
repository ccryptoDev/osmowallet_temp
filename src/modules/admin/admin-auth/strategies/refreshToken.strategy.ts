import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from 'src/modules/auth/payloads/auth.payload';

@Injectable()
export class AdminRefreshTokenStrategy extends PassportStrategy(Strategy, 'admin-jwt-refresh') {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.ADMIN_JWT_REFRESH_SECRET,
            passReqToCallback: true,
        });
    }

    validate(req: Request, payload: AuthUser) {
        const refreshToken = req.get('Authorization');
        if (!refreshToken) throw new Error('Refresh token not found');
        return { ...payload, refreshToken: refreshToken.replace('Bearer', '').trim() };
    }
}
