import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { UserRole } from 'src/user/entities/user.entity';
import { UserStatus } from 'src/user/entities/user.entity';
import { OwnerProfileType } from 'src/user/entities/user.entity';

export type JwtUser = {
  email: string;
  fullName: string;
  id: string;
  role: UserRole;
  organizationId?: string | null;
  status?: UserStatus;
  ownerProfileType?: OwnerProfileType | null;
  canManageOwnerTeam?: boolean;
};

export interface ExpressRequest extends Request {
  user: JwtUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ExpressRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No token found');
    }

    const secret = this.configService.get<string>('ACCESS_TOKEN');

    if (!secret) {
      throw new UnauthorizedException('JWT secret missing');
    }

    try {
      const decoded = await this.jwtService.verifyAsync<JwtUser>(token, {
        secret,
      });
      request.user = decoded;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    const accessToken = request.headers['access_token'];
    return typeof accessToken === 'string' ? accessToken : null;
  }
}
