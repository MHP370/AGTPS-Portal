import { Injectable } from '@nestjs/common';
import { TrainingPublishStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrainingCategoryDto } from './dto/create-training-category.dto';
import { CreateTrainingItemDto } from './dto/create-training-item.dto';
import { CreateTrainingSourceDto } from './dto/create-training-source.dto';
import { UpdateTrainingCategoryDto } from './dto/update-training-category.dto';
import { UpdateTrainingItemDto } from './dto/update-training-item.dto';
import { UpdateTrainingSourceDto } from './dto/update-training-source.dto';

@Injectable()
export class TrainingsService {
  constructor(private readonly prisma: PrismaService) {}

  findPublishedItems() {
    return this.prisma.trainingItem.findMany({
      where: {
        isActive: true,
        status: TrainingPublishStatus.PUBLISHED,
      },
      include: {
        category: true,
        files: {
          orderBy: [
            {
              sortOrder: 'asc',
            },
            {
              title: 'asc',
            },
          ],
        },
      },
      orderBy: [
        {
          updatedAt: 'desc',
        },
        {
          title: 'asc',
        },
      ],
    });
  }

  findAllItems() {
    return this.prisma.trainingItem.findMany({
      include: {
        category: true,
        files: {
          orderBy: [
            {
              sortOrder: 'asc',
            },
            {
              title: 'asc',
            },
          ],
        },
      },
      orderBy: [
        {
          updatedAt: 'desc',
        },
        {
          title: 'asc',
        },
      ],
    });
  }

  createItem(dto: CreateTrainingItemDto) {
    const { files, ...data } = dto;

    return this.prisma.trainingItem.create({
      data: {
        ...data,
        files: files?.length
          ? {
              create: files,
            }
          : undefined,
      },
      include: {
        category: true,
        files: {
          orderBy: [
            {
              sortOrder: 'asc',
            },
            {
              title: 'asc',
            },
          ],
        },
      },
    });
  }

  async updateItem(id: string, dto: UpdateTrainingItemDto) {
    const { files, ...data } = dto;

    return this.prisma.$transaction(async (prisma) => {
      if (files) {
        await prisma.trainingFile.deleteMany({
          where: {
            trainingId: id,
          },
        });
      }

      return prisma.trainingItem.update({
        where: {
          id,
        },
        data: {
          ...data,
          files: files
            ? {
                create: files,
              }
            : undefined,
        },
        include: {
          category: true,
          files: {
            orderBy: [
              {
                sortOrder: 'asc',
              },
              {
                title: 'asc',
              },
            ],
          },
        },
      });
    });
  }

  removeItem(id: string) {
    return this.prisma.trainingItem.delete({
      where: {
        id,
      },
    });
  }

  findCategories(includeInactive = false) {
    return this.prisma.trainingCategory.findMany({
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
          name: 'asc',
        },
      ],
    });
  }

  createCategory(dto: CreateTrainingCategoryDto) {
    return this.prisma.trainingCategory.create({
      data: dto,
    });
  }

  updateCategory(id: string, dto: UpdateTrainingCategoryDto) {
    return this.prisma.trainingCategory.update({
      where: {
        id,
      },
      data: dto,
    });
  }

  removeCategory(id: string) {
    return this.prisma.trainingCategory.delete({
      where: {
        id,
      },
    });
  }

  findSources() {
    return this.prisma.trainingSource.findMany({
      orderBy: [
        {
          isActive: 'desc',
        },
        {
          name: 'asc',
        },
      ],
    }).then((sources) => sources.map((source) => this.maskSourceSecret(source)));
  }

  async createSource(dto: CreateTrainingSourceDto) {
    const source = await this.prisma.trainingSource.create({
      data: dto,
    });

    return this.maskSourceSecret(source);
  }

  async updateSource(id: string, dto: UpdateTrainingSourceDto) {
    const source = await this.prisma.trainingSource.update({
      where: {
        id,
      },
      data: dto,
    });

    return this.maskSourceSecret(source);
  }

  removeSource(id: string) {
    return this.prisma.trainingSource.delete({
      where: {
        id,
      },
    });
  }

  private maskSourceSecret<T extends { password?: string | null }>(
    source: T,
  ) {
    return {
      ...source,
      password: source.password ? '__KEEP_EXISTING__' : null,
    };
  }
}
