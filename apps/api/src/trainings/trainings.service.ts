import { Injectable } from '@nestjs/common';
import {
  Prisma,
  TrainingProgressStatus,
  TrainingPublishStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInPersonParticipantDto } from './dto/create-in-person-participant.dto';
import { CreateInPersonTrainingDto } from './dto/create-in-person-training.dto';
import { CreateTrainingCategoryDto } from './dto/create-training-category.dto';
import { CreateTrainingItemDto } from './dto/create-training-item.dto';
import { CreateTrainingSourceDto } from './dto/create-training-source.dto';
import { UpdateInPersonParticipantDto } from './dto/update-in-person-participant.dto';
import { UpdateInPersonTrainingDto } from './dto/update-in-person-training.dto';
import { UpdateTrainingCategoryDto } from './dto/update-training-category.dto';
import { UpdateTrainingItemDto } from './dto/update-training-item.dto';
import { UpdateTrainingSourceDto } from './dto/update-training-source.dto';
import { UpsertTrainingProgressDto } from './dto/upsert-training-progress.dto';

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

  findInPersonTrainings() {
    return this.prisma.inPersonTraining.findMany({
      include: {
        category: true,
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            directoryUser: true,
          },
          orderBy: [
            {
              displayName: 'asc',
            },
          ],
        },
      },
      orderBy: [
        {
          startDate: 'desc',
        },
        {
          title: 'asc',
        },
      ],
    });
  }

  createInPersonTraining(dto: CreateInPersonTrainingDto) {
    return this.prisma.inPersonTraining.create({
      data: this.mapInPersonTrainingCreateDto(dto),
      include: {
        category: true,
        participants: true,
      },
    });
  }

  updateInPersonTraining(id: string, dto: UpdateInPersonTrainingDto) {
    return this.prisma.inPersonTraining.update({
      where: {
        id,
      },
      data: this.mapInPersonTrainingUpdateDto(dto),
      include: {
        category: true,
        participants: true,
      },
    });
  }

  removeInPersonTraining(id: string) {
    return this.prisma.inPersonTraining.delete({
      where: {
        id,
      },
    });
  }

  createInPersonParticipant(
    trainingId: string,
    dto: CreateInPersonParticipantDto,
  ) {
    return this.prisma.inPersonTrainingParticipant.create({
      data: this.mapInPersonParticipantCreateDto(trainingId, dto),
    });
  }

  updateInPersonParticipant(id: string, dto: UpdateInPersonParticipantDto) {
    return this.prisma.inPersonTrainingParticipant.update({
      where: {
        id,
      },
      data: this.mapInPersonParticipantUpdateDto(dto),
    });
  }

  removeInPersonParticipant(id: string) {
    return this.prisma.inPersonTrainingParticipant.delete({
      where: {
        id,
      },
    });
  }

  findProgress(trainingItemId: string, visitorKey: string) {
    return this.prisma.trainingProgress.findUnique({
      where: {
        trainingItemId_visitorKey: {
          trainingItemId,
          visitorKey,
        },
      },
    });
  }

  upsertProgress(trainingItemId: string, dto: UpsertTrainingProgressDto) {
    const progressPercent = Math.min(
      100,
      Math.max(0, Math.round(dto.progressPercent ?? 0)),
    );
    const status =
      dto.status ??
      (progressPercent >= 95
        ? TrainingProgressStatus.COMPLETED
        : progressPercent > 0
          ? TrainingProgressStatus.IN_PROGRESS
          : TrainingProgressStatus.NOT_STARTED);

    return this.prisma.trainingProgress.upsert({
      where: {
        trainingItemId_visitorKey: {
          trainingItemId,
          visitorKey: dto.visitorKey,
        },
      },
      update: {
        status,
        progressPercent,
        lastPositionSeconds: dto.lastPositionSeconds,
        durationSeconds: dto.durationSeconds,
        lastFileUrl: dto.lastFileUrl,
        lastViewedAt: new Date(),
        completedAt:
          status === TrainingProgressStatus.COMPLETED ? new Date() : undefined,
      },
      create: {
        trainingItemId,
        visitorKey: dto.visitorKey,
        status,
        progressPercent,
        lastPositionSeconds: dto.lastPositionSeconds,
        durationSeconds: dto.durationSeconds,
        lastFileUrl: dto.lastFileUrl,
        completedAt:
          status === TrainingProgressStatus.COMPLETED ? new Date() : undefined,
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
    return this.prisma.trainingSource
      .findMany({
        orderBy: [
          {
            isActive: 'desc',
          },
          {
            name: 'asc',
          },
        ],
      })
      .then((sources) =>
        sources.map((source) => this.maskSourceSecret(source)),
      );
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

  private maskSourceSecret<T extends { password?: string | null }>(source: T) {
    return {
      ...source,
      password: source.password ? '__KEEP_EXISTING__' : null,
    };
  }

  private mapInPersonTrainingCreateDto(
    dto: CreateInPersonTrainingDto,
  ): Prisma.InPersonTrainingUncheckedCreateInput {
    return {
      ...dto,
      categoryId: dto.categoryId || null,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : dto.endDate,
    };
  }

  private mapInPersonTrainingUpdateDto(
    dto: UpdateInPersonTrainingDto,
  ): Prisma.InPersonTrainingUncheckedUpdateInput {
    return {
      ...dto,
      categoryId:
        dto.categoryId === undefined ? undefined : dto.categoryId || null,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : dto.endDate,
    };
  }

  private mapInPersonParticipantCreateDto(
    trainingId: string,
    dto: CreateInPersonParticipantDto,
  ): Prisma.InPersonTrainingParticipantUncheckedCreateInput {
    return {
      ...dto,
      trainingId,
      userId: dto.userId || null,
      directoryUserId: dto.directoryUserId || null,
      email: dto.email || null,
      certificateNumber: dto.certificateNumber || null,
      notes: dto.notes || null,
    };
  }

  private mapInPersonParticipantUpdateDto(
    dto: UpdateInPersonParticipantDto,
  ): Prisma.InPersonTrainingParticipantUncheckedUpdateInput {
    return {
      ...dto,
      userId: dto.userId === undefined ? undefined : dto.userId || null,
      directoryUserId:
        dto.directoryUserId === undefined
          ? undefined
          : dto.directoryUserId || null,
      email: dto.email === undefined ? undefined : dto.email || null,
      certificateNumber:
        dto.certificateNumber === undefined
          ? undefined
          : dto.certificateNumber || null,
      notes: dto.notes === undefined ? undefined : dto.notes || null,
    };
  }
}
