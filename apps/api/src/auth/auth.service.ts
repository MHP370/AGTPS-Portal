import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);

    if (!user) {
      throw new UnauthorizedException(
        'Invalid username or password',
      );
    }

    const valid = await bcrypt.compare(
      password,
      user.password,
    );

    if (!valid) {
      throw new UnauthorizedException(
        'Invalid username or password',
      );
    }

    const payload = {
      sub: user.id,
      username: user.username,
    };

    const access_token =
      await this.jwtService.signAsync(payload);

    return {
      access_token,

      user: {
        id: user.id,
        username: user.username,
        email: user.email,

        firstName: user.firstName,
        lastName: user.lastName,

        isActive: user.isActive,
      },
    };
  }
}
