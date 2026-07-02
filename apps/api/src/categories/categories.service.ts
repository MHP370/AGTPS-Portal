import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findAll() {
    return this.prisma.applicationCategory.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });
  }

  findOne(id: string) {
    return this.prisma.applicationCategory.findUnique({
      where: {
        id,
      },
    });
  }

  create(data: {
    name: string;
    slug: string;
    icon?: string;
    color?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    return this.prisma.applicationCategory.create({
      data,
    });
  }

  update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      icon?: string;
      color?: string;
      description?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    return this.prisma.applicationCategory.update({
      where: {
        id,
      },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.applicationCategory.delete({
      where: {
        id,
      },
    });
  }
}
