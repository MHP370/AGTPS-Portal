import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.news.findMany({
      include: {
        site: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.news.findUnique({
      where: {
        id,
      },
      include: {
        site: true,
      },
    });
  }

  create(dto: CreateNewsDto) {
    return this.prisma.news.create({
      data: dto,
    });
  }

  update(
    id: string,
    dto: UpdateNewsDto,
  ) {
    return this.prisma.news.update({
      where: {
        id,
      },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.news.delete({
      where: {
        id,
      },
    });
  }
}
