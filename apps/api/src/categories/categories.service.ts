import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findAll() {
    return this.prisma.applicationCategory.findMany({
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

  async remove(id: string) {
    const category = await this.findOne(id);

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    const applicationsCount =
      await this.prisma.application.count({
        where: {
          categoryId: id,
        },
      });

    if (applicationsCount > 0) {
      throw new BadRequestException(
        'Category is used by applications. Disable it instead of deleting.',
      );
    }

    return this.prisma.applicationCategory.delete({
      where: {
        id,
      },
    });
  }
}
