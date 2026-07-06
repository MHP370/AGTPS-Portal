import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSystemStatusDto } from './dto/create-system-status.dto';
import { UpdateSystemStatusDto } from './dto/update-system-status.dto';

@Injectable()
export class SystemStatusesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includeInactive = false) {
    return this.prisma.systemStatus.findMany({
      where: includeInactive
        ? undefined
        : {
            isActive: true,
          },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          title: 'asc',
        },
      ],
    });
  }

  findOne(id: string) {
    return this.prisma.systemStatus.findUnique({
      where: {
        id,
      },
    });
  }

  create(dto: CreateSystemStatusDto) {
    return this.prisma.systemStatus.create({
      data: dto,
    });
  }

  update(id: string, dto: UpdateSystemStatusDto) {
    return this.prisma.systemStatus.update({
      where: {
        id,
      },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.systemStatus.delete({
      where: {
        id,
      },
    });
  }
}
