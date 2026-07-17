import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  findAll() {
    return this.prisma.announcement.findMany({
      orderBy: [
        {
          priority: 'desc',
        },
        {
          startDate: 'desc',
        },
      ],
    });
  }

  findOne(id: string) {
    return this.prisma.announcement.findUnique({
      where: {
        id,
      },
    });
  }

  async create(dto: CreateAnnouncementDto) {
    const announcement = await this.prisma.announcement.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate
          ? new Date(dto.endDate)
        : null,
      },
    });

    await this.createPublishedNotification(announcement);

    return announcement;
  }

  async update(
    id: string,
    dto: UpdateAnnouncementDto,
  ) {
    const current = await this.prisma.announcement.findUnique({
      where: {
        id,
      },
    });
    const announcement = await this.prisma.announcement.update({
      where: {
        id,
      },
      data: {
        ...dto,
        ...(dto.startDate && {
          startDate: new Date(dto.startDate),
        }),
        ...(dto.endDate !== undefined && {
          endDate: dto.endDate
            ? new Date(dto.endDate)
            : null,
        }),
      },
    });

    if (!current?.published && announcement.published) {
      await this.createPublishedNotification(announcement);
    }

    return announcement;
  }

  remove(id: string) {
    return this.prisma.announcement.delete({
      where: {
        id,
      },
    });
  }

  private async createPublishedNotification(announcement: {
    id: string;
    title: string;
    body: string;
    published: boolean;
    startDate: Date;
  }) {
    if (!announcement.published) return;

    await this.notificationsService.dispatchEvent({
      eventKey: 'announcement.published',
      portal: {
        type: NotificationType.ANNOUNCEMENT,
        title: 'اطلاعیه جدید',
        body: announcement.title,
        scheduledAt: announcement.startDate,
      },
    });
  }
}
