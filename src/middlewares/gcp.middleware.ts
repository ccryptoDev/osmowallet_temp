import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from 'src/modules/auth/auth.service';

@Injectable()
export class GCPMiddleware implements NestMiddleware {
    constructor(private readonly appService: AuthService) {}
    async use(req: Request, res: Response, next: NextFunction) {
        if (req.headers.authorization) {
            if (req.headers.authorization === process.env.GCLOUD_FUNCTIONS_API_KEY) {
                next();
            } else {
                throw new UnauthorizedException();
            }
        } else {
            throw new UnauthorizedException();
        }
    }
}
