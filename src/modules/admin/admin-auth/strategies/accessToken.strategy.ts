import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from 'src/modules/auth/payloads/auth.payload';


@Injectable()
export class AdminAccessTokenStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.ADMIN_JWT_ACCESS_SECRET,
      passReqToCallback: true,
      
    });
  }

  validate(req: Request,payload: AuthUser) {
    return payload;
  }
}
