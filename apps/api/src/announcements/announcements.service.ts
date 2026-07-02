import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

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

  create(dto: CreateAnnouncementDto) {
    return this.prisma.announcement.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate
          ? new Date(dto.endDate)
          : null,
      },
    });
  }

  update(
    id: string,
    dto: UpdateAnnouncementDto,
  ) {
    return this.prisma.announcement.update({
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
  }

  remove(id: string) {
    return this.prisma.announcement.delete({
      where: {
        id,
      },
    });
  }
}
