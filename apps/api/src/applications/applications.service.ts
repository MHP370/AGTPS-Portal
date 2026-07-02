import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.application.findMany({
      where: {
        isActive: true,
      },
      include: {
        category: true,
        sites: {
          include: {
            site: true,
          },
        },
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

  async findOne(id: string) {
    return this.prisma.application.findUnique({
      where: {
        id,
      },
      include: {
        category: true,
        sites: {
          include: {
            site: true,
          },
        },
      },
    });
  }

  async create(createApplicationDto: CreateApplicationDto) {
    return this.prisma.application.create({
      data: createApplicationDto,
      include: {
        category: true,
        sites: {
          include: {
            site: true,
          },
        },
      },
    });
  }

  async update(id: string, updateApplicationDto: UpdateApplicationDto) {
    return this.prisma.application.update({
      where: {
        id,
      },
      data: updateApplicationDto,
      include: {
        category: true,
        sites: {
          include: {
            site: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.application.delete({
      where: {
        id,
      },
    });
  }
}
