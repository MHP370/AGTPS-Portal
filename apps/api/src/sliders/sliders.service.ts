import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { CreateSliderDto } from './dto/create-slider.dto';
import { UpdateSliderDto } from './dto/update-slider.dto';

@Injectable()
export class SlidersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.slider.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.slider.findUnique({
      where: {
        id,
      },
    });
  }

  create(dto: CreateSliderDto) {
    return this.prisma.slider.create({
      data: dto,
    });
  }

  update(
    id: string,
    dto: UpdateSliderDto,
  ) {
    return this.prisma.slider.update({
      where: {
        id,
      },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.slider.delete({
      where: {
        id,
      },
    });
  }
}
