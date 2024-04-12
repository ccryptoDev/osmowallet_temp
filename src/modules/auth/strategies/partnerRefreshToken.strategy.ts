import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';
import { AuthUser } from '../payloads/auth.payload';

@Injectable()
export class PartnerRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'partner-jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.PARTNER_REFRESH_SECRET,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: AuthUser) {
    const refreshToken = req.get('Authorization').replace('Bearer', '').trim();
    return { ...payload, refreshToken };
  }
}
