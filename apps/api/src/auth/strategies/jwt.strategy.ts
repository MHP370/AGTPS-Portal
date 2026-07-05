import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey:
        process.env.JWT_SECRET ||
        'AGTPS_SECRET_KEY_CHANGE_ME',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
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
    const directoryUser = user
      ? await this.prisma.directoryUser.findFirst({
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
        })
      : null;
    const userRoles = user?.roles.map((r) => r.role.name) ?? [];
    const groupRoles =
      directoryUser?.groupMemberships.flatMap((membership) =>
        membership.group.roles.map((item) => item.role.name),
      ) ?? [];
    const userPermissions =
      user?.roles.flatMap((r) =>
        r.role.permissions.map(
          (p) => p.permission.name,
        ),
      ) ?? [];
    const groupPermissions =
      directoryUser?.groupMemberships.flatMap((membership) =>
        membership.group.roles.flatMap((item) =>
          item.role.permissions.map(
            (permission) => permission.permission.name,
          ),
        ),
      ) ?? [];

    return {
  id: user?.id,
  username: user?.username,
  email: user?.email,

  roles:
    Array.from(new Set([...userRoles, ...groupRoles])),

  permissions:
    Array.from(new Set([...userPermissions, ...groupPermissions])),
};
  }
}
