import { ForbiddenException, Injectable } from '@nestjs/common';
import { DirectorySource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDirectoryGroupDto } from './dto/create-directory-group.dto';
import { CreateDirectoryUserDto } from './dto/create-directory-user.dto';
import { UpdateDirectoryGroupDto } from './dto/update-directory-group.dto';
import { UpdateDirectoryUserDto } from './dto/update-directory-user.dto';
import { UpdateGroupMembersDto } from './dto/update-group-members.dto';
import { UpdateGroupRolesDto } from './dto/update-group-roles.dto';

@Injectable()
export class DirectoryService {
  constructor(private readonly prisma: PrismaService) {}

  findUsers() {
    return this.prisma.directoryUser.findMany({
      where: { isActive: true },
      include: {
        groupMemberships: {
          include: {
            group: true,
          },
        },
      },
      orderBy: {
        displayName: 'asc',
      },
    });
  }

  createUser(dto: CreateDirectoryUserDto) {
    const { groupIds, ...data } = dto;

    return this.prisma.directoryUser.create({
      data: {
        ...data,
        source: DirectorySource.INTERNAL,
        groupMemberships: groupIds?.length
          ? {
              create: groupIds.map((groupId) => ({
                groupId,
              })),
            }
          : undefined,
      },
      include: {
        groupMemberships: {
          include: {
            group: true,
          },
        },
      },
    });
  }

  async updateUser(id: string, dto: UpdateDirectoryUserDto) {
    await this.assertInternalUser(id);
    return this.prisma.directoryUser.update({
      where: { id },
      data: { ...dto, source: DirectorySource.INTERNAL },
    });
  }

  async removeUser(id: string) {
    await this.assertInternalUser(id);
    return this.prisma.directoryUser.delete({
      where: { id },
    });
  }

  findGroups() {
    return this.prisma.directoryGroup.findMany({
      where: { isActive: true },
      include: {
        members: {
          include: {
            user: true,
          },
        },
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
      orderBy: {
        title: 'asc',
      },
    });
  }

  createGroup(dto: CreateDirectoryGroupDto) {
    return this.prisma.directoryGroup.create({
      data: { ...dto, source: DirectorySource.INTERNAL },
    });
  }

  async updateGroup(id: string, dto: UpdateDirectoryGroupDto) {
    await this.assertInternalGroup(id);
    return this.prisma.directoryGroup.update({
      where: { id },
      data: { ...dto, source: DirectorySource.INTERNAL },
    });
  }

  async updateGroupMembers(id: string, dto: UpdateGroupMembersDto) {
    await this.assertInternalGroup(id);
    return this.prisma.directoryGroup.update({
      where: { id },
      data: {
        members: {
          deleteMany: {},
          create: dto.userIds.map((userId) => ({
            userId,
          })),
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  updateGroupRoles(id: string, dto: UpdateGroupRolesDto) {
    return this.prisma.directoryGroup.update({
      where: { id },
      data: {
        roles: {
          deleteMany: {},
          create: dto.roleIds.map((roleId) => ({
            roleId,
          })),
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
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
  }

  async removeGroup(id: string) {
    await this.assertInternalGroup(id);
    return this.prisma.directoryGroup.delete({
      where: { id },
    });
  }

  private async assertInternalUser(id: string) {
    const user = await this.prisma.directoryUser.findUniqueOrThrow({
      where: { id },
      select: { source: true },
    });
    if (user.source === DirectorySource.ACTIVE_DIRECTORY) {
      throw new ForbiddenException(
        'کاربران اکتیو دایرکتوری فقط از طریق همگام‌سازی مدیریت می‌شوند.',
      );
    }
  }

  private async assertInternalGroup(id: string) {
    const group = await this.prisma.directoryGroup.findUniqueOrThrow({
      where: { id },
      select: { source: true },
    });
    if (group.source === DirectorySource.ACTIVE_DIRECTORY) {
      throw new ForbiddenException(
        'اعضا و اطلاعات گروه‌های اکتیو دایرکتوری فقط از طریق همگام‌سازی مدیریت می‌شوند.',
      );
    }
  }
}
