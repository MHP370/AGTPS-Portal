import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserRolesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findByUser(userId: string) {
    return this.prisma.userRole.findMany({
      where: {
        userId,
      },
      include: {
        role: true,
      },
    });
  }

  assign(
    userId: string,
    roleId: string,
  ) {
    return this.prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
  }

  remove(
    userId: string,
    roleId: string,
  ) {
    return this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
  }
}
