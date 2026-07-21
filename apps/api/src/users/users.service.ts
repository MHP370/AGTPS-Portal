import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: {
        username,
      },
    });
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        username: 'asc',
      },
    });

    const directoryUsers =
      await this.prisma.directoryUser.findMany({
        where: {
          OR: users.flatMap((user) => [
            {
              username: user.username,
            },
            {
              email: user.email,
            },
          ]),
        },
      });

    return users.map((user) => {
      const directoryUser = directoryUsers.find(
        (item) =>
          item.username === user.username ||
          item.email === user.email,
      );

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        personnelCode: user.personnelCode,
        birthDate: user.birthDate?.toISOString().slice(0, 10) ?? null,
        mobile: user.mobile,
        allowEmailChange: user.allowEmailChange,
        allowPasswordChange: user.allowPasswordChange,
        allowProfileEdit: user.allowProfileEdit,
        isActive: user.isActive,
        roles: user.roles.map((item) => item.role),
        directoryUser,
        canChangePassword:
          directoryUser?.source !== 'ACTIVE_DIRECTORY',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    });
  }

  async changePassword(id: string, password: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id,
      },
    });
    const directoryUser =
      await this.prisma.directoryUser.findFirst({
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

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        password: hashedPassword,
      },
    });

    return {
      ok: true,
    };
  }

  async updateProfile(id: string, dto: UpdateUserProfileDto) {
    const birthDate = dto.birthDate ? new Date(dto.birthDate) : null;

    if (dto.birthDate && Number.isNaN(birthDate?.getTime())) {
      throw new BadRequestException('Invalid birth date.');
    }

    if (dto.email) {
      const existingEmailUser = await this.prisma.user.findFirst({
        where: {
          email: dto.email.trim(),
          NOT: {
            id,
          },
        },
      });

      if (existingEmailUser) {
        throw new ConflictException('Email is already used by another user.');
      }
    }

    if (dto.newPassword) {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: {
          id,
        },
      });
      const directoryUser =
        await this.prisma.directoryUser.findFirst({
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
    }

    const password = dto.newPassword
      ? await bcrypt.hash(dto.newPassword, 10)
      : undefined;

    await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        email: dto.email?.trim(),
        firstName: dto.firstName?.trim() || null,
        lastName: dto.lastName?.trim() || null,
        personnelCode: dto.personnelCode?.trim() || null,
        birthDate,
        mobile: dto.mobile?.trim() || null,
        isActive: dto.isActive,
        allowEmailChange: dto.allowEmailChange,
        allowPasswordChange: dto.allowPasswordChange,
        allowProfileEdit: dto.allowProfileEdit,
        password,
      },
    });

    return this.findAll();
  }
}
