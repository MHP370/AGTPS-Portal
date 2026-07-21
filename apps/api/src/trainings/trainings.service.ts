import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { mkdir, rename, stat, unlink } from 'node:fs/promises';
import * as path from 'node:path';
import {
  Prisma,
  TrainingProgressStatus,
  TrainingPublishStatus,
  TrainingContentType,
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
import { testSmbConnection } from '../common/smb/smb-connection';
import {
  downloadKerberosSmbFile,
  downloadSharedSmbFile,
  listKerberosSmbItems,
  listSharedSmbItems,
  uploadSharedSmbFile,
} from '../common/smb/kerberos-smb-client';
import { decryptSecret, encryptSecret } from '../common/security/secret-box';

interface TrainingSyncUser {
  username: string;
}

interface TrainingContentUser {
  permissions?: string[];
}

const trainingContentTypes: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

const trainingFileTypes: Record<string, TrainingContentType> = {
  '.mp4': TrainingContentType.VIDEO,
  '.mkv': TrainingContentType.VIDEO,
  '.webm': TrainingContentType.VIDEO,
  '.pdf': TrainingContentType.PDF,
  '.doc': TrainingContentType.DOCUMENT,
  '.docx': TrainingContentType.DOCUMENT,
  '.xls': TrainingContentType.SPREADSHEET,
  '.xlsx': TrainingContentType.SPREADSHEET,
  '.ppt': TrainingContentType.PRESENTATION,
  '.pptx': TrainingContentType.PRESENTATION,
  '.jpg': TrainingContentType.IMAGE,
  '.jpeg': TrainingContentType.IMAGE,
  '.png': TrainingContentType.IMAGE,
};

@Injectable()
export class TrainingsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TrainingsService.name);
  private syncTimer?: NodeJS.Timeout;
  private readonly runningSourceIds = new Set<string>();

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.syncTimer = setInterval(() => void this.runScheduledSourceSyncs(), 60_000);
    void this.runScheduledSourceSyncs();
  }

  onModuleDestroy() {
    if (this.syncTimer) clearInterval(this.syncTimer);
  }

  private async runScheduledSourceSyncs() {
    const sources = await this.prisma.trainingSource.findMany({
      where: { isActive: true },
    });
    const now = Date.now();
    for (const source of sources) {
      const intervalMs = Math.max(source.syncIntervalMinutes, 1) * 60_000;
      if (
        this.runningSourceIds.has(source.id) ||
        now - (source.lastSyncAt?.getTime() ?? 0) < intervalMs
      ) {
        continue;
      }
      this.runningSourceIds.add(source.id);
      void this.syncSource(source.id, { username: 'scheduler' })
        .catch((error) =>
          this.logger.error(
            `Scheduled training sync failed for ${source.name}`,
            error instanceof Error ? error.stack : undefined,
          ),
        )
        .finally(() => this.runningSourceIds.delete(source.id));
    }
  }

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
      data: {
        ...dto,
        password: encryptSecret(dto.password),
      },
    });

    return this.maskSourceSecret(source);
  }

  async updateSource(id: string, dto: UpdateTrainingSourceDto) {
    const existing = await this.prisma.trainingSource.findUniqueOrThrow({
      where: { id },
    });
    const source = await this.prisma.trainingSource.update({
      where: {
        id,
      },
      data: {
        ...dto,
        password:
          dto.password === '__KEEP_EXISTING__' || dto.password === undefined
            ? existing.password
            : encryptSecret(dto.password),
      },
    });

    return this.maskSourceSecret(source);
  }

  async testSource(id: string) {
    const source = await this.prisma.trainingSource.findUniqueOrThrow({ where: { id } });
    const result = await testSmbConnection(source.basePath);
    await this.prisma.trainingSource.update({
      where: { id },
      data: {
        lastSyncAt: new Date(result.checkedAt),
        lastSyncStatus: result.kerberosReady ? 'READY' : result.reachable ? 'NETWORK_REACHABLE' : 'FAILED',
        lastSyncError: result.kerberosReady ? null : result.message,
      },
    });
    return result;
  }

  async syncSource(id: string, user: TrainingSyncUser) {
    const source = await this.prisma.trainingSource.findUniqueOrThrow({
      where: { id },
    });
    const files: Array<{
      name: string;
      path: string;
      size: number | null;
      extension: string | null;
    }> = [];
    const queue: Array<{ path: string; depth: number }> = [{ path: '', depth: 0 }];
    let scannedFolders = 0;
    const syncUsername =
      process.env.KERBEROS_SYNC_USERNAME || 'svc-agtps-portal';

    try {
      while (queue.length > 0 && scannedFolders < 500 && files.length < 5000) {
        const current = queue.shift()!;
        const items =
          source.authMode === 'SERVICE_ACCOUNT'
            ? await listSharedSmbItems(
                source.basePath,
                source.username || '',
                decryptSecret(source.password),
                current.path,
              )
            : await listKerberosSmbItems(
                source.basePath,
                syncUsername,
                current.path,
              );
        scannedFolders += 1;

        for (const item of items) {
          if (item.type === 'folder' && current.depth < 8) {
            queue.push({ path: item.path, depth: current.depth + 1 });
          } else if (
            item.type === 'file' &&
            item.extension &&
            trainingFileTypes[item.extension]
          ) {
            files.push(item);
          }
        }
      }

      const previousGroups = await this.prisma.trainingItem.findMany({
        where: {
          sourceType: 'SMB',
          sourcePath: { startsWith: `${source.id}:` },
        },
        select: { sourcePath: true, standaloneSubfolders: true },
      });
      const standalonePaths = new Set(
        previousGroups.flatMap((item) => {
          const root = item.sourcePath?.slice(source.id.length + 1) || '';
          return item.standaloneSubfolders.map((folder) =>
            [root, folder].filter(Boolean).join('/').replace(/\/+$/g, ''),
          );
        }),
      );
      const groups = new Map<string, typeof files>();
      for (const file of files) {
        const segments = file.path.split('/').filter(Boolean);
        let root =
          segments[0] === source.uploadDirectory && segments.length > 2
            ? segments.slice(0, 2).join('/')
            : segments[0] || '__root__';
        const promoted = [...standalonePaths]
          .filter((candidate) => file.path === candidate || file.path.startsWith(`${candidate}/`))
          .sort((a, b) => b.length - a.length)[0];
        if (promoted) root = promoted;
        const group = groups.get(root) || [];
        group.push(file);
        groups.set(root, group);
      }

      let created = 0;
      let updated = 0;
      const activeSourcePaths: string[] = [];
      for (const [folderPath, groupFiles] of groups) {
        const sourcePath = `${source.id}:${folderPath}`;
        activeSourcePaths.push(sourcePath);
        const title =
          folderPath === '__root__'
            ? 'فایل‌های اصلی'
            : folderPath.split('/').at(-1) || folderPath;
        const slug = `smb-${createHash('sha256').update(sourcePath).digest('hex').slice(0, 24)}`;
        const primary = groupFiles[0];
        const existing = await this.prisma.trainingItem.findFirst({
          where: { sourceType: 'SMB', sourcePath },
          select: { id: true },
        });

        if (existing) {
          const fileUrl = `/api/trainings/items/${existing.id}/content?path=${encodeURIComponent(primary.path)}`;
          await this.prisma.trainingItem.update({
            where: { id: existing.id },
            data: {
              contentType: trainingFileTypes[primary.extension!],
              fileUrl,
              isActive: true,
              files: {
                deleteMany: {},
                create: groupFiles.map((file, index) => ({
                  title: file.name,
                  sourcePath: file.path,
                  fileUrl: `/api/trainings/items/${existing.id}/content?path=${encodeURIComponent(file.path)}`,
                  fileType: file.extension,
                  fileSize:
                    file.size != null && file.size <= 2_147_483_647
                      ? file.size
                      : null,
                  isPrimary: index === 0,
                  sortOrder: index,
                })),
              },
            },
          });
          updated += 1;
        } else {
          const createdItem = await this.prisma.trainingItem.create({
            data: {
              title,
              slug,
              contentType: trainingFileTypes[primary.extension!],
              sourceType: 'SMB',
              sourcePath,
              status: TrainingPublishStatus.NEEDS_REVIEW,
              isActive: true,
              tags: ['SMB'],
            },
          });
          const fileUrl = `/api/trainings/items/${createdItem.id}/content?path=${encodeURIComponent(primary.path)}`;
          await this.prisma.trainingItem.update({
            where: { id: createdItem.id },
            data: {
              fileUrl,
              files: {
                create: groupFiles.map((file, index) => ({
                  title: file.name,
                  sourcePath: file.path,
                  fileUrl: `/api/trainings/items/${createdItem.id}/content?path=${encodeURIComponent(file.path)}`,
                  fileType: file.extension,
                  fileSize:
                    file.size != null && file.size <= 2_147_483_647
                      ? file.size
                      : null,
                  isPrimary: index === 0,
                  sortOrder: index,
                })),
              },
            },
          });
          created += 1;
        }
      }
      await this.prisma.trainingItem.updateMany({
        where: {
          sourceType: 'SMB',
          sourcePath: { startsWith: `${source.id}:`, notIn: activeSourcePaths },
        },
        data: { status: TrainingPublishStatus.ARCHIVED, isActive: false },
      });

      const checkedAt = new Date();
      await this.prisma.trainingSource.update({
        where: { id },
        data: {
          lastSyncAt: checkedAt,
          lastSyncStatus: 'SYNCED',
          lastSyncError: null,
        },
      });
      return { created, updated, discovered: files.length, scannedFolders, checkedAt };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'SMB sync failed.';
      await this.prisma.trainingSource.update({
        where: { id },
        data: { lastSyncAt: new Date(), lastSyncStatus: 'FAILED', lastSyncError: message },
      });
      throw error;
    }
  }

  async prepareSmbContent(
    id: string,
    user: TrainingContentUser,
    requestedPath?: string,
  ) {
    const item = await this.prisma.trainingItem.findUnique({
      where: { id },
      include: { files: true },
    });
    if (!item || item.sourceType !== 'SMB' || !item.sourcePath) {
      throw new NotFoundException('Training file was not found.');
    }
    const canManage = user.permissions?.includes('training.manage');
    if (
      !canManage &&
      (!item.isActive || item.status !== TrainingPublishStatus.PUBLISHED)
    ) {
      throw new ForbiddenException('Training is not published.');
    }

    const separator = item.sourcePath.indexOf(':');
    if (separator < 1) throw new NotFoundException('Training source is invalid.');
    const sourceId = item.sourcePath.slice(0, separator);
    const selectedFile = requestedPath
      ? item.files.find((file) => file.sourcePath === requestedPath)
      : item.files.find((file) => file.isPrimary) || item.files[0];
    const relativePath =
      selectedFile?.sourcePath || item.sourcePath.slice(separator + 1);
    if (!relativePath) throw new NotFoundException('Training file was not found.');
    const source = await this.prisma.trainingSource.findUnique({
      where: { id: sourceId },
    });
    if (!source?.isActive) throw new NotFoundException('Training source is inactive.');

    const cacheRoot = process.env.TRAINING_CACHE_DIR || '/var/cache/agtps/training';
    await mkdir(cacheRoot, { recursive: true });
    const extension = path.extname(relativePath).toLowerCase();
    const cacheKey = createHash('sha256')
      .update(`${source.id}:${relativePath}`)
      .digest('hex');
    const cachedPath = path.join(cacheRoot, `${cacheKey}${extension}`);
    let fileStat = await stat(cachedPath).catch(() => null);

    if (!fileStat?.isFile()) {
      const temporaryPath = `${cachedPath}.${process.pid}.part`;
      if (source.authMode === 'SERVICE_ACCOUNT') {
        await downloadSharedSmbFile(
          source.basePath,
          source.username || '',
          decryptSecret(source.password),
          relativePath,
          temporaryPath,
        );
      } else {
        await downloadKerberosSmbFile(
          source.basePath,
          process.env.KERBEROS_SYNC_USERNAME || 'svc-agtps-portal',
          relativePath,
          temporaryPath,
        );
      }
      await rename(temporaryPath, cachedPath);
      fileStat = await stat(cachedPath);
    }

    return {
      path: cachedPath,
      size: fileStat.size,
      filename: path.basename(relativePath),
      contentType: trainingContentTypes[extension] || 'application/octet-stream',
    };
  }

  async uploadSourceFile(
    sourceId: string,
    rawTrainingSlug: string,
    file: { originalname: string; path: string; size: number },
  ) {
    const source = await this.prisma.trainingSource.findUniqueOrThrow({
      where: { id: sourceId },
    });
    if (
      source.authMode !== 'SERVICE_ACCOUNT' ||
      !source.username ||
      !source.password
    ) {
      throw new ForbiddenException(
        'برای آپلود، منبع آموزش باید حساب سرویس Read/Write داشته باشد.',
      );
    }
    const trainingSlug = rawTrainingSlug
      ?.trim()
      .replace(/[^\p{L}\p{N}._-]+/gu, '-')
      .replace(/^-+|-+$/g, '');
    if (!trainingSlug || !file?.path) {
      throw new NotFoundException('نام آموزش و فایل الزامی است.');
    }
    const filename = path.basename(file.originalname).replace(/[\0\r\n";]/g, '_');
    const relativePath = [source.uploadDirectory, trainingSlug, filename].join('/');
    try {
      await uploadSharedSmbFile(
        source.basePath,
        source.username,
        decryptSecret(source.password),
        file.path,
        relativePath,
      );
    } finally {
      await unlink(file.path).catch(() => undefined);
    }
    const sync = await this.syncSource(source.id, { username: 'upload' });
    return { path: relativePath, size: file.size, sync };
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
