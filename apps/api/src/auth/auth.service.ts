import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeOwnPasswordDto } from './dto/change-own-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
      throw new UnauthorizedException('Invalid username or password');
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const payload = {
      sub: user.id,
      username: user.username,
    };

    const access_token = await this.jwtService.signAsync(payload);

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
      item.role.permissions.map((permission) => permission.permission.name),
    );
    const groupPermissions =
      directoryUser?.groupMemberships.flatMap((membership) =>
        membership.group.roles.flatMap((item) =>
          item.role.permissions.map((permission) => permission.permission.name),
        ),
      ) ?? [];
    const settings = await this.prisma.setting.findUnique({
      where: {
        id: 1,
      },
    });
    const missingProfileFields = [
      settings?.requireUserPersonnelCode && !user.personnelCode
        ? 'personnelCode'
        : null,
      settings?.requireUserBirthDate && !user.birthDate ? 'birthDate' : null,
    ].filter(Boolean) as Array<'personnelCode' | 'birthDate'>;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      personnelCode: user.personnelCode,
      birthDate: user.birthDate?.toISOString().slice(0, 10) ?? null,
      allowEmailChange: user.allowEmailChange,
      allowPasswordChange: user.allowPasswordChange,
      allowProfileEdit: user.allowProfileEdit,
      fullName:
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        directoryUser?.displayName ||
        user.username,
      isActive: user.isActive,
      authSource:
        directoryUser?.source === 'ACTIVE_DIRECTORY'
          ? 'ACTIVE_DIRECTORY'
          : 'INTERNAL',
      roles: Array.from(new Set([...userRoleNames, ...groupRoleNames])),
      roleDetails: Array.from(
        new Map(
          [
            ...user.roles.map((item) => item.role),
            ...(directoryUser?.groupMemberships.flatMap((membership) =>
              membership.group.roles.map((item) => item.role),
            ) ?? []),
          ].map((role) => [role.id, role]),
        ).values(),
      ),
      permissions: Array.from(
        new Set([...userPermissions, ...groupPermissions]),
      ),
      profileCompletionRequired: missingProfileFields.length > 0,
      missingProfileFields,
      profileRequirements: {
        personnelCode: Boolean(settings?.requireUserPersonnelCode),
        birthDate: Boolean(settings?.requireUserBirthDate),
      },
      directoryUser,
      directoryGroups:
        directoryUser?.groupMemberships.map((membership) => ({
          id: membership.group.id,
          name: membership.group.name,
          title: membership.group.title,
          source: membership.group.source,
          isActive: membership.group.isActive,
        })) ?? [],
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
    });
    const birthDate = dto.birthDate ? new Date(dto.birthDate) : null;

    if (dto.birthDate && Number.isNaN(birthDate?.getTime())) {
      throw new BadRequestException('Invalid birth date.');
    }

    const settings = await this.prisma.setting.findUnique({
      where: {
        id: 1,
      },
    });
    const missingProfileFields = [
      settings?.requireUserPersonnelCode && !user.personnelCode
        ? 'personnelCode'
        : null,
      settings?.requireUserBirthDate && !user.birthDate ? 'birthDate' : null,
    ].filter(Boolean);
    const canEditProfile =
      user.allowProfileEdit || missingProfileFields.length > 0;

    if (
      !canEditProfile &&
      (dto.firstName !== undefined ||
        dto.lastName !== undefined ||
        dto.personnelCode !== undefined ||
        dto.birthDate !== undefined)
    ) {
      throw new BadRequestException('Profile editing is disabled for this user.');
    }

    if (dto.email !== undefined && !user.allowEmailChange) {
      throw new BadRequestException('Email editing is disabled for this user.');
    }

    if (dto.email) {
      const existingEmailUser = await this.prisma.user.findFirst({
        where: {
          email: dto.email.trim(),
          NOT: {
            id: userId,
          },
        },
      });

      if (existingEmailUser) {
        throw new BadRequestException('Email is already used by another user.');
      }
    }

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        email: dto.email?.trim(),
        firstName: dto.firstName?.trim() || null,
        lastName: dto.lastName?.trim() || null,
        personnelCode: dto.personnelCode?.trim() || null,
        birthDate,
      },
    });

    return this.getProfile(userId);
  }

  async changeOwnPassword(userId: string, dto: ChangeOwnPasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
    });

    const directoryUser = await this.prisma.directoryUser.findFirst({
      where: {
        OR: [
          {
            username: user.username,
          },
          {
            email: user.email,
          },
        ],
      },
    });

    if (directoryUser?.source === 'ACTIVE_DIRECTORY') {
      throw new BadRequestException(
        'Active Directory user passwords must be changed in Active Directory.',
      );
    }

    if (!user.allowPasswordChange) {
      throw new BadRequestException('Password editing is disabled for this user.');
    }

    const passwordMatches = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!passwordMatches) {
      throw new BadRequestException('Current password is incorrect.');
    }

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: await bcrypt.hash(dto.newPassword, 10),
      },
    });

    return {
      ok: true,
    };
  }
}
