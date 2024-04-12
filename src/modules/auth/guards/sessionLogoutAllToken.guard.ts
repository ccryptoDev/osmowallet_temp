import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SessionLogoutAllTokenGuard extends AuthGuard('session-logout-all') {}
