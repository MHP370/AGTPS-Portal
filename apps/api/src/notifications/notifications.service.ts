import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.portalNotification.findMany({
      where: {
        OR: [
          {
            scheduledAt: null,
          },
          {
            scheduledAt: {
              lte: new Date(),
            },
          },
        ],
      },
      include: {
        meeting: true,
        recipientDirectoryUser: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 30,
    });
  }

  markRead(id: string) {
    return this.prisma.portalNotification.update({
      where: { id },
      data: {
        readAt: new Date(),
      },
    });
  }
}
