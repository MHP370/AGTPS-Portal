import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
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

      user: await this.getProfile(user.id),
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    const directoryUser = await this.prisma.directoryUser.findFirst({
      where: {
        isActive: true,
        OR: [
          {
            username: user.username,
          },
          {
            email: user.email,
          },
        ],
      },
      include: {
        groupMemberships: {
          include: {
            group: {
              include: {
                roles: {
                  include: {
                    role: {
                      include: {
                        permissions: {
                          include: {
                            permission: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const userRoleNames = user.roles.map((item) => item.role.name);
    const groupRoleNames =
      directoryUser?.groupMemberships.flatMap((membership) =>
        membership.group.roles.map((item) => item.role.name),
      ) ?? [];
    const userPermissions = user.roles.flatMap((item) =>
      item.role.permissions.map(
        (permission) => permission.permission.name,
      ),
    );
    const groupPermissions =
      directoryUser?.groupMemberships.flatMap((membership) =>
        membership.group.roles.flatMap((item) =>
          item.role.permissions.map(
            (permission) => permission.permission.name,
          ),
        ),
      ) ?? [];

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      roles: Array.from(new Set([...userRoleNames, ...groupRoleNames])),
      permissions: Array.from(
        new Set([...userPermissions, ...groupPermissions]),
      ),
      directoryUser,
    };
  }
}
