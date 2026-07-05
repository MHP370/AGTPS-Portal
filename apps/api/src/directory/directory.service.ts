import { Injectable } from '@nestjs/common';
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

  updateUser(id: string, dto: UpdateDirectoryUserDto) {
    return this.prisma.directoryUser.update({
      where: { id },
      data: dto,
    });
  }

  removeUser(id: string) {
    return this.prisma.directoryUser.delete({
      where: { id },
    });
  }

  findGroups() {
    return this.prisma.directoryGroup.findMany({
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
      data: dto,
    });
  }

  updateGroup(id: string, dto: UpdateDirectoryGroupDto) {
    return this.prisma.directoryGroup.update({
      where: { id },
      data: dto,
    });
  }

  updateGroupMembers(id: string, dto: UpdateGroupMembersDto) {
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

  removeGroup(id: string) {
    return this.prisma.directoryGroup.delete({
      where: { id },
    });
  }
}
