import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { App } from 'src/entities/app.entity';
import { User } from 'src/entities/user.entity';
import { AuthUser } from 'src/modules/auth/payloads/auth.payload';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { AdminAuthDto } from './dtos/adminauth.dto';
import { Request } from 'express';
import { Config, SDK } from '@corbado/node-sdk';

@Injectable()
export class AdminAuthService {
  private sdk: SDK
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(App) private appRepository: Repository<App>,
    private jwtService: JwtService,
  ) {
    const config = new Config(process.env.CORBADO_PROJECT_ID, process.env.CORBADO_API_SECRET);
    this.sdk = new SDK(config);
    //this.createAdmin()
  }

  private async validateApp(data: AdminAuthDto){
    const app = await this.appRepository.findOneBy({
      clientId: data.clientId,
      clientSecret: data.clientSecret,
    });
    if (!app) throw new UnauthorizedException();
  }

  async signinWithPasskey(req: Request, data: AdminAuthDto){
    await this.validateApp(data)
    try{
      const token = req.headers.authorization
      const corbadoUser = await this.sdk.sessions().getCurrentUser(token);
      const email = corbadoUser.getEmail() == '' ? corbadoUser.getName() :  corbadoUser.getEmail()

      if(!email.toLocaleLowerCase().endsWith('@osmowallet.com')) throw new UnauthorizedException()

      const user = await this.userRepository.findOneBy({email: email})
      const tokens = await this.getTokens(user.id)
      return tokens
    }catch(error){
      console.log(error)
      throw new UnauthorizedException()
    }
  }

  async createAdmin() {
    const pass = await this.hashPassword('demodemo123');
    const user = this.userRepository.create({
      email: 'amilkar@osmowallet.com',
      password: pass,
      firstName: 'amilkar',
      lastName: 'admin',
      residence: 'PA',
    });
    await this.userRepository.insert(user);
  }

  async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');
    return [salt, hash].join('.');
  }

  async verifyPassword(storedPassword: string,providedPassword: string,): Promise<boolean> {
    const [salt, storedHash] = storedPassword.split('.');
    const hash = crypto.pbkdf2Sync(providedPassword, salt, 1000, 64, 'sha512').toString('hex');
    return hash === storedHash;
  }

  async signinWithEmailAndPassword(data: AdminAuthDto) {
    if (!data.email.endsWith('@osmowallet.com'))
      throw new UnauthorizedException();
    await this.validateApp(data)
    // Check if user exists
    const user = await this.userRepository.findOneBy({ email: data.email });
    // user.password = await this.hashPassword('demodemo123')
    // await this.userRepository.save(user)
    if (!user) throw new BadRequestException('Credenciales incorrectas');
    const passwordMatches = await this.verifyPassword(
      user.password,
      data.password,
    );

    if (!passwordMatches)
      throw new BadRequestException('Credenciales incorrectas');
    const tokens = await this.getTokens(user.id);
    return tokens;
  }

  async refreshTokens(authUser: AuthUser, data: AdminAuthDto) {
    try {
      const app = await this.appRepository.findOneBy({
        clientId: data.clientId,
        clientSecret: data.clientSecret,
      });
      if (!app) throw new UnauthorizedException();
      return await this.getTokens(authUser.sub);
    } catch (error) {
      throw error;
    }
  }

  private async getTokens(userId: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
        },
        {
          secret: process.env.ADMIN_JWT_ACCESS_SECRET,
          expiresIn: '1d',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
        },
        {
          secret: process.env.ADMIN_JWT_REFRESH_SECRET,
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async activate2FA(authUser: AuthUser){
    await this.userRepository.update(authUser.sub, {
      is2FAEnabled: true
    })
  }

  async deactivate2FA(authUser: AuthUser){
    await this.userRepository.update(authUser.sub, {
      is2FAEnabled: false
    })
  }
}
