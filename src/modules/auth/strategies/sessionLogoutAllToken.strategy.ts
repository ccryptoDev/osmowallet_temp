import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../payloads/auth.payload';

@Injectable()
export class SessionLogoutAllTokenStrategy extends PassportStrategy(Strategy, 'session-logout-all') {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromUrlQueryParameter('token'),
            secretOrKey: process.env.SESSION_LOGOUT_ALL_ACCESS_KEY,
            passReqToCallback: true,
            ignoreExpiration: true,
        });
    }

    validate(payload: AuthUser) {
        return payload;
    }
}
