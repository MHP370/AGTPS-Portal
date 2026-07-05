import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDownloadDto } from './dto/create-download.dto';
import { UpdateDownloadDto } from './dto/update-download.dto';

@Injectable()
export class DownloadsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includeInactive = false) {
    return this.prisma.portalDownload.findMany({
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

  create(dto: CreateDownloadDto) {
    return this.prisma.portalDownload.create({
      data: dto,
    });
  }

  update(id: string, dto: UpdateDownloadDto) {
    return this.prisma.portalDownload.update({
      where: {
        id,
      },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.portalDownload.delete({
      where: {
        id,
      },
    });
  }
}
