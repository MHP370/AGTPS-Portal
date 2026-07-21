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
import { ActiveDirectoryAuthService } from './active-directory-auth.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly activeDirectoryAuth: ActiveDirectoryAuthService,
  ) {}

  async login(
    username: string,
    password: string,
    authSource: 'LOCAL' | 'ACTIVE_DIRECTORY' = 'LOCAL',
  ) {
    const user = authSource === 'ACTIVE_DIRECTORY'
      ? await this.activeDirectoryAuth.authenticate(username, password)
      : await this.usersService.findByUsername(username);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (authSource === 'LOCAL') {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        throw new UnauthorizedException('Invalid username or password');
      }
    }

    return this.createSession(user.id, user.username);
  }

  async getWindowsIdentity(identity: string) {
    const result = await this.activeDirectoryAuth.authenticateTrustedWindowsIdentity(identity);
    return {
      username: result.directoryUser.username,
      displayName: result.directoryUser.displayName,
      domain: result.domain,
    };
  }

  async loginWithWindowsIdentity(identity: string) {
    const result = await this.activeDirectoryAuth.authenticateTrustedWindowsIdentity(identity);
    return this.createSession(result.user.id, result.user.username);
  }

  private async createSession(userId: string, username: string) {
    const access_token = await this.jwtService.signAsync({ sub: userId, username });
    return { access_token, user: await this.getProfile(userId) };
  }

  async getLoginOptions() {
    const settings = await this.prisma.setting.findUnique({
      where: { id: 1 },
      select: {
        activeDirectoryEnabled: true,
        activeDirectoryDomain: true,
        activeDirectoryUrl: true,
        windowsSsoEnabled: true,
        requirePortalLogin: true,
      },
    });
    return {
      local: { enabled: true, label: "ورود محلی" },
      activeDirectory: {
        enabled: Boolean(settings?.activeDirectoryEnabled && settings.activeDirectoryDomain),
        domain: settings?.activeDirectoryDomain ?? null,
        secure: settings?.activeDirectoryUrl?.toLowerCase().startsWith("ldaps://") ?? false,
      },
      windowsSso: {
        enabled: Boolean(
          settings?.activeDirectoryEnabled &&
          settings.activeDirectoryDomain &&
          settings.windowsSsoEnabled
        ),
      },
      requirePortalLogin: Boolean(settings?.requirePortalLogin),
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
        id: user.directoryUserId ?? '__NO_DIRECTORY_USER__',
        isActive: true,
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
      settings?.requireUserPersonnelCode && !user.personnelCode ? 'personnelCode' : null,
      settings?.requireUserBirthDate && !user.birthDate ? 'birthDate' : null,
      settings?.requireUserEmail && !(directoryUser ? directoryUser.email : user.email) ? 'email' : null,
      settings?.requireUserMobile && !(directoryUser ? directoryUser.mobile : user.mobile) ? 'mobile' : null,
    ].filter(Boolean) as Array<'personnelCode' | 'birthDate' | 'email' | 'mobile'>;

    return {
      id: user.id,
      username: user.username,
      email: directoryUser?.email ?? (directoryUser ? null : user.email),
      mobile: directoryUser?.mobile ?? user.mobile,
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
        email: Boolean(settings?.requireUserEmail),
        mobile: Boolean(settings?.requireUserMobile),
      },
      directoryUser: directoryUser
        ? {
            id: directoryUser.id,
            username: directoryUser.username,
            displayName: directoryUser.displayName,
            email: directoryUser.email,
            mobile: directoryUser.mobile,
            department: directoryUser.department,
            title: directoryUser.title,
            isActive: directoryUser.isActive,
          }
        : null,
      directoryGroups:
        Array.from(new Set([...userPermissions, ...groupPermissions])).includes("directory.manage")
          ? directoryUser?.groupMemberships.map((membership) => ({
          id: membership.group.id,
          name: membership.group.name,
          title: membership.group.title,
          source: membership.group.source,
          isActive: membership.group.isActive,
        })) ?? []
          : [],
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
    });
    const directoryUser = user.directoryUserId
      ? await this.prisma.directoryUser.findUnique({ where: { id: user.directoryUserId } })
      : null;
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
      settings?.requireUserPersonnelCode && !user.personnelCode ? 'personnelCode' : null,
      settings?.requireUserBirthDate && !user.birthDate ? 'birthDate' : null,
      settings?.requireUserEmail && !(directoryUser ? directoryUser.email : user.email) ? 'email' : null,
      settings?.requireUserMobile && !(directoryUser ? directoryUser.mobile : user.mobile) ? 'mobile' : null,
    ].filter(Boolean);
    const canEditProfile =
      user.allowProfileEdit || missingProfileFields.length > 0;

    if (
      !canEditProfile &&
      (dto.firstName !== undefined ||
        dto.lastName !== undefined ||
        dto.personnelCode !== undefined ||
        dto.birthDate !== undefined ||
        dto.mobile !== undefined)
    ) {
      throw new BadRequestException('Profile editing is disabled for this user.');
    }

    const isDirectoryUser = directoryUser?.source === "ACTIVE_DIRECTORY";
    if (dto.email !== undefined && !user.allowEmailChange && !isDirectoryUser) {
      throw new BadRequestException('Email editing is disabled for this user.');
    }

    const normalizedEmail = dto.email?.trim().toLowerCase();
    const normalizedMobile = dto.mobile?.trim();

    if (normalizedEmail) {
      const existingEmailUser = await this.prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          NOT: {
            id: userId,
          },
        },
      });

      if (existingEmailUser) {
        throw new BadRequestException('Email is already used by another user.');
      }
    }

    if (settings?.requireUserEmail && dto.email !== undefined && !normalizedEmail) {
      throw new BadRequestException("Email is required.");
    }
    if (settings?.requireUserMobile && dto.mobile !== undefined && !normalizedMobile) {
      throw new BadRequestException("Mobile is required.");
    }
    if (isDirectoryUser && (dto.email !== undefined || dto.mobile !== undefined)) {
      await this.activeDirectoryAuth.updateContact(directoryUser.distinguishedName, {
        email: dto.email !== undefined ? normalizedEmail : undefined,
        mobile: dto.mobile !== undefined ? normalizedMobile : undefined,
      });
    }

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...(normalizedEmail && { email: normalizedEmail }),
        ...(dto.mobile !== undefined && { mobile: normalizedMobile || null }),
        ...(dto.firstName !== undefined && { firstName: dto.firstName.trim() || null }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName.trim() || null }),
        ...(dto.personnelCode !== undefined && { personnelCode: dto.personnelCode.trim() || null }),
        ...(dto.birthDate !== undefined && { birthDate }),
      },
    });

    if (isDirectoryUser) {
      await this.prisma.directoryUser.update({
        where: { id: directoryUser.id },
        data: {
          ...(dto.email !== undefined && { email: normalizedEmail || null }),
          ...(dto.mobile !== undefined && { mobile: normalizedMobile || null }),
        },
      });
    }

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
          { id: user.directoryUserId ?? "__NO_DIRECTORY_USER__" },
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
