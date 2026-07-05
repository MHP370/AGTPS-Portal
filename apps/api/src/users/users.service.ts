import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

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
}
