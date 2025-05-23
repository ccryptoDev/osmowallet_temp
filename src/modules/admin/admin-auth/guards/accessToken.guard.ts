import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminAccessTokenGuard extends AuthGuard('admin-jwt') {}
