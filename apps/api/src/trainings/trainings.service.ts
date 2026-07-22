import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, rename, stat, unlink } from 'node:fs/promises';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import {
  Prisma,
  TrainingProgressStatus,
  TrainingPublishStatus,
  TrainingContentType,
  TrainingCertificateSource,
  TrainingCertificateMode,
  TrainingCertificateNumberStrategy,
  TrainingExamAttemptStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
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
import {
  IssueTrainingCertificateDto,
  SubmitTrainingExamDto,
  UpsertCertificateTemplateDto,
  UpsertTrainingExamDto,
} from './dto/upsert-training-exam.dto';
import { UpsertTrainingSignatoryDto } from './dto/training-management.dto';
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

interface TrainingAdminUser {
  id?: string;
  permissions?: string[];
}

export interface TrainingTreeNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  relativePath: string;
  fullPath: string;
  promotionPath?: string;
  file?: {
    id: string;
    title: string;
    fileUrl: string;
    sourcePath: string | null;
    fileType: string | null;
    fileSize: number | null;
    isPrimary: boolean;
  };
  children: TrainingTreeNode[];
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
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
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
  '.webp': TrainingContentType.IMAGE,
  '.gif': TrainingContentType.IMAGE,
  '.mp3': TrainingContentType.ATTACHMENT,
  '.wav': TrainingContentType.ATTACHMENT,
  '.ogg': TrainingContentType.ATTACHMENT,
  '.m4a': TrainingContentType.ATTACHMENT,
  '.aac': TrainingContentType.ATTACHMENT,
  '.flac': TrainingContentType.ATTACHMENT,
};

const execFileAsync = promisify(execFile);
const officePreviewExtensions = new Set([
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
]);

@Injectable()
export class TrainingsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TrainingsService.name);
  private syncTimer?: NodeJS.Timeout;
  private readonly runningSourceIds = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

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

  async findItemTree(id: string) {
    const item = await this.prisma.trainingItem.findUnique({
      where: { id },
      include: {
        files: { orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }] },
      },
    });
    if (!item) throw new NotFoundException('Training was not found.');

    const separator = item.sourcePath?.indexOf(':') ?? -1;
    const sourceId = separator > 0 ? item.sourcePath!.slice(0, separator) : null;
    const relativeRoot = separator > 0 ? item.sourcePath!.slice(separator + 1) : '';
    const source = sourceId
      ? await this.prisma.trainingSource.findUnique({ where: { id: sourceId } })
      : null;
    const basePath = source?.basePath?.replace(/[\\/]+$/g, '') || '';
    const toFullPath = (relativePath: string) =>
      basePath
        ? `${basePath}\\${relativePath.replace(/\//g, '\\')}`
        : relativePath.replace(/\//g, '\\');
    const root: TrainingTreeNode = {
      id: relativeRoot || 'root',
      name: relativeRoot.split('/').filter(Boolean).at(-1) || item.title,
      type: 'folder',
      relativePath: relativeRoot,
      fullPath: toFullPath(relativeRoot),
      children: [],
    };

    const folders = new Map<string, TrainingTreeNode>([[relativeRoot, root]]);
    for (const file of item.files) {
      const filePath = file.sourcePath || file.title;
      const relativeSegments = filePath.split('/').filter(Boolean);
      const rootSegments = relativeRoot.split('/').filter(Boolean);
      const nestedSegments = relativeSegments.slice(rootSegments.length);
      let parent = root;
      let currentPath = relativeRoot;

      for (const segment of nestedSegments.slice(0, -1)) {
        currentPath = [currentPath, segment].filter(Boolean).join('/');
        let folder = folders.get(currentPath);
        if (!folder) {
          const promotionPath = currentPath
            .slice(relativeRoot.length)
            .replace(/^\/+/, '');
          folder = {
            id: currentPath,
            name: segment,
            type: 'folder',
            relativePath: currentPath,
            fullPath: toFullPath(currentPath),
            promotionPath,
            children: [],
          };
          folders.set(currentPath, folder);
          parent.children.push(folder);
        }
        parent = folder;
      }

      parent.children.push({
        id: file.id,
        name: nestedSegments.at(-1) || file.title,
        type: 'file',
        relativePath: filePath,
        fullPath: toFullPath(filePath),
        file: {
          id: file.id,
          title: file.title,
          fileUrl: file.fileUrl,
          sourcePath: file.sourcePath,
          fileType: file.fileType,
          fileSize: file.fileSize,
          isPrimary: file.isPrimary,
        },
        children: [],
      });
    }

    const sortNodes = (nodes: TrainingTreeNode[]) => {
      nodes.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name, 'fa');
      });
      nodes.forEach((node) => sortNodes(node.children));
    };
    sortNodes(root.children);

    return {
      trainingId: item.id,
      sourceType: item.sourceType,
      sourceName: source?.name || null,
      relativeRoot,
      fullRootPath: root.fullPath,
      root,
    };
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
        certificateTemplate: true,
        exam: { select: { id: true, title: true, isPublished: true, version: true, _count: { select: { questions: true, attempts: true } } } },
        _count: { select: { participants: true } },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                personnelCode: true,
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

  findInPersonTrainingDetail(id: string) {
    return this.prisma.inPersonTraining.findUniqueOrThrow({
      where: { id },
      include: {
        category: true,
        certificateTemplate: { include: { signatories: { include: { signatory: true }, orderBy: { sortOrder: 'asc' } } } },
        exam: { include: { questions: { orderBy: { sortOrder: 'asc' } }, attempts: { orderBy: { createdAt: 'desc' } } } },
        participants: {
          include: {
            user: { select: { id: true, username: true, firstName: true, lastName: true, email: true, personnelCode: true } },
            directoryUser: { select: { id: true, username: true, displayName: true, department: true, title: true } },
            examAttempts: { orderBy: { attemptNumber: 'desc' } },
            certificates: { include: { template: true }, orderBy: { issuedAt: 'desc' } },
          },
          orderBy: { displayName: 'asc' },
        },
        auditEvents: { include: { actor: { select: { username: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, take: 100 },
      },
    });
  }

  async findCourseReports() {
    const [courses, participants, passed, failed, certificates, attempts] = await this.prisma.$transaction([
      this.prisma.inPersonTraining.count(),
      this.prisma.inPersonTrainingParticipant.count(),
      this.prisma.inPersonTrainingParticipant.count({ where: { result: 'PASSED' } }),
      this.prisma.inPersonTrainingParticipant.count({ where: { result: 'FAILED' } }),
      this.prisma.trainingCertificate.count(),
      this.prisma.trainingExamAttempt.count({ where: { status: 'GRADED' } }),
    ]);
    const recentCourses = await this.prisma.inPersonTraining.findMany({
      include: { _count: { select: { participants: true } }, participants: { select: { result: true, certificates: { select: { id: true } } } } },
      orderBy: { startDate: 'desc' },
      take: 50,
    });
    return { totals: { courses, participants, passed, failed, certificates, attempts }, recentCourses };
  }

  async findTrainingUsers(search = '', page = 1, pageSize = 15) {
    const safePage = Math.max(1, page);
    const safeSize = Math.min(50, Math.max(1, pageSize));
    const term = search.trim();
    const where: Prisma.InPersonTrainingParticipantWhereInput = term ? { OR: [
      { displayName: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { personnelCode: { contains: term, mode: 'insensitive' } },
      { directoryUser: { username: { contains: term, mode: 'insensitive' } } },
    ] } : {};
    const grouped = await this.prisma.inPersonTrainingParticipant.findMany({
      where,
      include: { training: { select: { id: true, title: true, startDate: true, status: true } }, examAttempts: true, certificates: true, directoryUser: { select: { username: true, department: true } } },
      orderBy: [{ displayName: 'asc' }, { createdAt: 'desc' }],
    });
    const users = new Map<string, typeof grouped>();
    grouped.forEach((item) => {
      const key = item.directoryUserId || item.userId || item.email || item.displayName;
      users.set(key, [...(users.get(key) || []), item]);
    });
    const items = [...users.entries()].map(([id, history]) => ({ id, displayName: history[0].displayName, personnelCode: history[0].personnelCode, email: history[0].email, username: history[0].directoryUser?.username, department: history[0].directoryUser?.department, history }));
    return { items: items.slice((safePage - 1) * safeSize, safePage * safeSize), total: items.length, page: safePage, pageSize: safeSize };
  }

  async findEligibleParticipants(search = '', page = 1, pageSize = 12) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(50, Math.max(1, pageSize));
    const normalizedSearch = search.trim();
    const where: Prisma.DirectoryUserWhereInput = {
      source: 'ACTIVE_DIRECTORY',
      isActive: true,
      ...(normalizedSearch
        ? {
            OR: [
              { displayName: { contains: normalizedSearch, mode: 'insensitive' } },
              { username: { contains: normalizedSearch, mode: 'insensitive' } },
              { email: { contains: normalizedSearch, mode: 'insensitive' } },
              { department: { contains: normalizedSearch, mode: 'insensitive' } },
              { portalUser: { personnelCode: { contains: normalizedSearch, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.directoryUser.findMany({
        where,
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          department: true,
          title: true,
          portalUser: { select: { id: true, personnelCode: true } },
        },
        orderBy: [{ displayName: 'asc' }, { username: 'asc' }],
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
      }),
      this.prisma.directoryUser.count({ where }),
    ]);
    return { items: items.map(({ portalUser, ...item }) => ({ ...item, personnelCode: portalUser?.personnelCode || null })), total, page: safePage, pageSize: safePageSize };
  }

  async enrollDirectoryUsers(trainingId: string, directoryUserIds: string[], actor: TrainingAdminUser = {}) {
    const training = await this.prisma.inPersonTraining.findUniqueOrThrow({
      where: { id: trainingId },
    });
    this.assertCourseMutable(training, actor, 'افزودن شرکت‌کننده');
    const uniqueIds = [...new Set(directoryUserIds)];
    const users = await this.prisma.directoryUser.findMany({
      where: {
        id: { in: uniqueIds },
        source: 'ACTIVE_DIRECTORY',
        isActive: true,
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        portalUser: { select: { id: true, personnelCode: true } },
      },
    });
    const existing = await this.prisma.inPersonTrainingParticipant.findMany({
      where: { trainingId, directoryUserId: { in: users.map((user) => user.id) } },
      select: { directoryUserId: true },
    });
    const existingIds = new Set(existing.map((item) => item.directoryUserId));
    const pending = users.filter((user) => !existingIds.has(user.id));
    if (pending.length > 0) {
      await this.prisma.inPersonTrainingParticipant.createMany({
        data: pending.map((user) => ({
          trainingId,
          directoryUserId: user.id,
          userId: user.portalUser?.id || null,
          displayName: user.displayName,
          email: user.email,
          personnelCode: user.portalUser?.personnelCode || null,
        })),
      });
    }
    await this.recordCourseAudit(trainingId, actor.id, 'PARTICIPANTS_ADDED', undefined, { added: pending.length, requested: uniqueIds.length });
    if (pending.length && this.isTrainingVisibleToParticipants(training.status)) {
      await this.queueTrainingLifecycleNotifications(
        trainingId,
        'approved',
        pending.map((user) => user.id),
      );
    }
    return {
      added: pending.length,
      skipped: uniqueIds.length - pending.length,
    };
  }

  findMyCourses(user: { id?: string; directoryUserId?: string }) {
    if (!user.id && !user.directoryUserId) return [];
    return this.prisma.inPersonTrainingParticipant.findMany({
      where: {
        training: {
          status: { in: ['APPROVED', 'OPEN', 'IN_PROGRESS', 'COMPLETED'] },
        },
        OR: [
          ...(user.id ? [{ userId: user.id }] : []),
          ...(user.directoryUserId
            ? [{ directoryUserId: user.directoryUserId }]
            : []),
        ],
      },
      include: {
        training: { include: { category: true, exam: { select: { id: true, title: true, isPublished: true } } } },
        examAttempts: { orderBy: { attemptNumber: 'desc' } },
        certificates: { include: { template: true }, orderBy: { issuedAt: 'desc' } },
      },
      orderBy: [{ training: { startDate: 'desc' } }, { createdAt: 'desc' }],
    });
  }

  findAdminTrainingExam(trainingId: string) {
    return this.prisma.trainingExam.findUnique({
      where: { trainingId },
      include: { questions: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } },
    });
  }

  async upsertTrainingExam(trainingId: string, dto: UpsertTrainingExamDto, actor: TrainingAdminUser = {}) {
    const training = await this.prisma.inPersonTraining.findUniqueOrThrow({ where: { id: trainingId } });
    this.assertCourseMutable(training, actor, 'ویرایش آزمون');
    const current = await this.prisma.trainingExam.findUnique({ where: { trainingId }, include: { _count: { select: { attempts: true } } } });
    if (current?._count.attempts) {
      throw new BadRequestException('این آزمون پاسخ ثبت‌شده دارد و قابل ویرایش نیست. برای تغییر، یک دوره یا نسخه جدید ایجاد کنید.');
    }
    const exam = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.trainingExam.upsert({
        where: { trainingId },
        create: {
          trainingId,
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          passingScore: dto.passingScore,
          durationMinutes: dto.durationMinutes || null,
          maxAttempts: dto.maxAttempts,
          shuffleQuestions: dto.shuffleQuestions,
          showResultImmediately: dto.showResultImmediately,
          isPublished: dto.isPublished,
          publishedAt: dto.isPublished ? new Date() : null,
        },
        update: {
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          passingScore: dto.passingScore,
          durationMinutes: dto.durationMinutes || null,
          maxAttempts: dto.maxAttempts,
          shuffleQuestions: dto.shuffleQuestions,
          showResultImmediately: dto.showResultImmediately,
          isPublished: dto.isPublished,
          publishedAt: dto.isPublished ? current?.publishedAt || new Date() : null,
        },
      });
      await tx.trainingExamQuestion.deleteMany({ where: { examId: saved.id } });
      if (dto.questions.length) {
        await tx.trainingExamQuestion.createMany({
          data: dto.questions.map((question, index) => ({
            examId: saved.id,
            type: question.type,
            title: question.title.trim(),
            description: question.description?.trim() || null,
            options: (question.options ?? Prisma.JsonNull) as Prisma.InputJsonValue,
            correctAnswer: (question.correctAnswer ?? Prisma.JsonNull) as Prisma.InputJsonValue,
            points: question.points,
            sortOrder: question.sortOrder ?? index,
            isRequired: question.isRequired ?? true,
          })),
        });
      }
      await tx.inPersonTraining.update({ where: { id: trainingId }, data: { hasExam: true } });
      return saved;
    });
    return this.findAdminTrainingExam(exam.trainingId);
  }

  findAdminExams() {
    return this.prisma.trainingExam.findMany({
      include: { training: { select: { id: true, title: true, status: true, startDate: true } }, _count: { select: { questions: true, attempts: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findMyTrainingExam(trainingId: string, user: { id?: string; directoryUserId?: string }) {
    const participant = await this.findOwnedParticipant(trainingId, user);
    const exam = await this.prisma.trainingExam.findFirst({
      where: { trainingId, isPublished: true },
      include: { questions: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } },
    });
    if (!exam) throw new NotFoundException('آزمون منتشرشده‌ای برای این دوره وجود ندارد.');
    const attempts = await this.prisma.trainingExamAttempt.findMany({
      where: { examId: exam.id, participantId: participant.id },
      orderBy: { attemptNumber: 'desc' },
    });
    const publicQuestions = exam.questions.map(({ correctAnswer: _correctAnswer, ...question }) => question);
    if (exam.shuffleQuestions) {
      for (let index = publicQuestions.length - 1; index > 0; index -= 1) {
        const target = Math.floor(Math.random() * (index + 1));
        [publicQuestions[index], publicQuestions[target]] = [publicQuestions[target], publicQuestions[index]];
      }
    }
    return {
      ...exam,
      questions: publicQuestions,
      attempts,
      remainingAttempts: Math.max(0, exam.maxAttempts - attempts.length),
    };
  }

  async startTrainingExam(trainingId: string, user: { id?: string; directoryUserId?: string }) {
    const participant = await this.findOwnedParticipant(trainingId, user);
    const exam = await this.prisma.trainingExam.findFirstOrThrow({ where: { trainingId, isPublished: true } });
    const existing = await this.prisma.trainingExamAttempt.findFirst({
      where: { examId: exam.id, participantId: participant.id, status: TrainingExamAttemptStatus.IN_PROGRESS },
      orderBy: { attemptNumber: 'desc' },
    });
    if (existing) return existing;
    const count = await this.prisma.trainingExamAttempt.count({ where: { examId: exam.id, participantId: participant.id } });
    if (count >= exam.maxAttempts) throw new BadRequestException('تعداد مجاز شرکت در آزمون تمام شده است.');
    return this.prisma.trainingExamAttempt.create({
      data: { examId: exam.id, participantId: participant.id, attemptNumber: count + 1 },
    });
  }

  async submitTrainingExam(attemptId: string, user: { id?: string; directoryUserId?: string }, dto: SubmitTrainingExamDto) {
    const attempt = await this.prisma.trainingExamAttempt.findUniqueOrThrow({
      where: { id: attemptId },
      include: { exam: { include: { questions: true } }, participant: true },
    });
    const owns = (user.id && attempt.participant.userId === user.id) ||
      (user.directoryUserId && attempt.participant.directoryUserId === user.directoryUserId);
    if (!owns) throw new ForbiddenException('این تلاش آزمون متعلق به شما نیست.');
    if (attempt.status !== TrainingExamAttemptStatus.IN_PROGRESS) throw new BadRequestException('این آزمون قبلاً ثبت شده است.');
    if (attempt.exam.durationMinutes && Date.now() > attempt.startedAt.getTime() + attempt.exam.durationMinutes * 60_000) {
      await this.prisma.trainingExamAttempt.update({
        where: { id: attempt.id },
        data: { status: TrainingExamAttemptStatus.EXPIRED, submittedAt: new Date() },
      });
      throw new BadRequestException('زمان آزمون به پایان رسیده است.');
    }
    const answerMap = new Map(dto.answers.map((answer) => [answer.questionId, answer.value]));
    const maxScore = attempt.exam.questions.reduce((sum, question) => sum + question.points, 0);
    const earned = attempt.exam.questions.reduce((sum, question) =>
      sum + (this.examAnswersEqual(answerMap.get(question.id), question.correctAnswer) ? question.points : 0), 0);
    const percentage = maxScore > 0 ? Math.round((earned / maxScore) * 10000) / 100 : 0;
    const passed = percentage >= attempt.exam.passingScore;
    const saved = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.trainingExamAttempt.update({
        where: { id: attempt.id },
        data: {
          answers: dto.answers as unknown as Prisma.InputJsonValue,
          score: percentage,
          maxScore: 100,
          passed,
          status: TrainingExamAttemptStatus.GRADED,
          submittedAt: new Date(),
          gradedAt: new Date(),
        },
      });
      await tx.inPersonTrainingParticipant.update({
        where: { id: attempt.participantId },
        data: { score: percentage, result: passed ? 'PASSED' : 'FAILED' },
      });
      return updated;
    });
    if (passed) await this.issueAutomaticCertificateForParticipant(attempt.participantId);
    await this.notifyTrainingParticipant(
      attempt.participantId,
      `training.exam.${attempt.id}`,
      `نتیجه آزمون «${attempt.exam.title}» ثبت شد`,
      passed ? `با امتیاز ${percentage} قبول شدید.` : `امتیاز شما ${percentage} است و حدنصاب قبولی کسب نشد.`,
    );
    return attempt.exam.showResultImmediately ? saved : { ...saved, score: null, passed: null };
  }

  findCertificateTemplates(admin = false) {
    return this.prisma.trainingCertificateTemplate.findMany({
      where: admin ? {} : { isActive: true },
      include: { signatories: { include: { signatory: true }, orderBy: { sortOrder: 'asc' } }, _count: { select: { certificates: true, trainings: true } } },
      orderBy: [{ isDefault: 'desc' }, { title: 'asc' }],
    });
  }

  async createCertificateTemplate(dto: UpsertCertificateTemplateDto) {
    if (dto.isDefault) await this.prisma.trainingCertificateTemplate.updateMany({ data: { isDefault: false } });
    const { signatories = [], ...template } = dto;
    return this.prisma.trainingCertificateTemplate.create({
      data: { ...template, description: dto.description || null, backgroundUrl: dto.backgroundUrl || null, layout: dto.layout as Prisma.InputJsonValue, signatories: { create: signatories.map((item, index) => ({ signatoryId: item.signatoryId, sortOrder: item.sortOrder ?? index, position: (item.position || Prisma.JsonNull) as Prisma.InputJsonValue })) } },
      include: { signatories: { include: { signatory: true } } },
    });
  }

  async updateCertificateTemplate(id: string, dto: UpsertCertificateTemplateDto) {
    if (dto.isDefault) await this.prisma.trainingCertificateTemplate.updateMany({ where: { id: { not: id } }, data: { isDefault: false } });
    const existing = await this.prisma.trainingCertificateTemplate.findUniqueOrThrow({ where: { id }, include: { _count: { select: { certificates: true } } } });
    const { signatories = [], ...template } = dto;
    return this.prisma.trainingCertificateTemplate.update({
      where: { id },
      data: { ...template, description: dto.description || null, backgroundUrl: dto.backgroundUrl || null, layout: dto.layout as Prisma.InputJsonValue, signatories: existing._count.certificates ? undefined : { deleteMany: {}, create: signatories.map((item, index) => ({ signatoryId: item.signatoryId, sortOrder: item.sortOrder ?? index, position: (item.position || Prisma.JsonNull) as Prisma.InputJsonValue })) } },
      include: { signatories: { include: { signatory: true } } },
    });
  }

  removeCertificateTemplate(id: string) {
    return this.prisma.trainingCertificateTemplate.update({ where: { id }, data: { isActive: false } });
  }

  findCertificateSignatories() {
    return this.prisma.trainingCertificateSignatory.findMany({ orderBy: [{ isActive: 'desc' }, { sortOrder: 'asc' }, { fullName: 'asc' }] });
  }

  createCertificateSignatory(dto: UpsertTrainingSignatoryDto) {
    return this.prisma.trainingCertificateSignatory.create({ data: this.mapSignatoryDto(dto) });
  }

  updateCertificateSignatory(id: string, dto: UpsertTrainingSignatoryDto) {
    return this.prisma.trainingCertificateSignatory.update({ where: { id }, data: this.mapSignatoryDto(dto) });
  }

  async removeCertificateSignatory(id: string) {
    const used = await this.prisma.trainingCertificateTemplateSignatory.count({ where: { signatoryId: id } });
    if (used) return this.prisma.trainingCertificateSignatory.update({ where: { id }, data: { isActive: false } });
    return this.prisma.trainingCertificateSignatory.delete({ where: { id } });
  }

  async issueCertificate(dto: IssueTrainingCertificateDto) {
    const participant = await this.prisma.inPersonTrainingParticipant.findUniqueOrThrow({ where: { id: dto.participantId }, include: { training: true } });
    if (participant.training.certificateValidationRegex && !new RegExp(participant.training.certificateValidationRegex).test(dto.certificateNumber.trim())) {
      throw new BadRequestException('شماره گواهی با الگوی اعتبارسنجی این دوره مطابقت ندارد.');
    }
    const snapshot = await this.buildCertificateSnapshot(dto.participantId, dto.templateId || participant.training.certificateTemplateId);
    const certificate = await this.prisma.trainingCertificate.create({
      data: {
        participantId: dto.participantId,
        templateId: dto.templateId || null,
        certificateNumber: dto.certificateNumber.trim(),
        title: dto.title?.trim() || null,
        source: dto.fileUrl ? TrainingCertificateSource.MANUAL_UPLOAD : TrainingCertificateSource.GENERATED,
        fileUrl: dto.fileUrl || null,
        mimeType: dto.mimeType || null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        notes: dto.notes?.trim() || null,
        snapshot: snapshot as Prisma.InputJsonValue,
      },
      include: { template: true },
    });
    await this.prisma.inPersonTrainingParticipant.update({
      where: { id: participant.id },
      data: { certificateNumber: certificate.certificateNumber },
    });
    await this.notifyTrainingParticipant(
      participant.id,
      `training.certificate.${certificate.id}`,
      `گواهی دوره «${participant.training.title}» صادر شد`,
      `شماره گواهی: ${certificate.certificateNumber}`,
    );
    return certificate;
  }

  removeCertificate(id: string) {
    throw new BadRequestException('گواهی صادرشده حذف نمی‌شود؛ برای اصلاح، گواهی جایگزین صادر کنید.');
  }

  async generateCourseCertificates(trainingId: string, participantIds?: string[]) {
    const participants = await this.prisma.inPersonTrainingParticipant.findMany({ where: { trainingId, ...(participantIds?.length ? { id: { in: participantIds } } : {}) } });
    let issued = 0;
    let skipped = 0;
    for (const participant of participants) {
      const certificate = await this.issueAutomaticCertificateForParticipant(participant.id, true);
      if (certificate) issued += 1; else skipped += 1;
    }
    return { issued, skipped };
  }

  async verifyCertificate(certificateNumber: string) {
    const certificate = await this.prisma.trainingCertificate.findUnique({
      where: { certificateNumber: certificateNumber.trim() },
      include: { participant: { include: { training: true } } },
    });
    if (!certificate) throw new NotFoundException("گواهی با این شماره یافت نشد.");
    return {
      certificateNumber: certificate.certificateNumber,
      issuedAt: certificate.issuedAt,
      expiresAt: certificate.expiresAt,
      title: certificate.title || certificate.participant.training.title,
      participantName: certificate.participant.displayName,
      courseCode: certificate.participant.training.courseCode,
      courseTitle: certificate.participant.training.title,
      valid: true,
    };
  }

  async findMyCertificate(id: string, user: { id?: string; directoryUserId?: string }) {
    const certificate = await this.prisma.trainingCertificate.findUnique({
      where: { id },
      include: {
        template: true,
        participant: { include: { training: true } },
      },
    });
    if (!certificate) throw new NotFoundException('گواهی پیدا نشد.');
    const owns = (user.id && certificate.participant.userId === user.id) ||
      (user.directoryUserId && certificate.participant.directoryUserId === user.directoryUserId);
    if (!owns) throw new ForbiddenException('این گواهی متعلق به شما نیست.');
    return certificate;
  }

  private async findOwnedParticipant(trainingId: string, user: { id?: string; directoryUserId?: string }) {
    const participant = await this.prisma.inPersonTrainingParticipant.findFirst({
      where: {
        trainingId,
        OR: [
          ...(user.id ? [{ userId: user.id }] : []),
          ...(user.directoryUserId ? [{ directoryUserId: user.directoryUserId }] : []),
        ],
      },
    });
    if (!participant) throw new ForbiddenException('شما شرکت‌کننده این دوره نیستید.');
    return participant;
  }

  private examAnswersEqual(actual: unknown, expected: unknown) {
    const normalize = (value: unknown): string => {
      if (Array.isArray(value)) return JSON.stringify([...value].map(String).sort());
      if (typeof value === 'string') return value.trim().toLocaleLowerCase('fa-IR');
      return JSON.stringify(value ?? null);
    };
    return normalize(actual) === normalize(expected);
  }

  private isCourseLocked(training: { status: string; lockedAt: Date | null; unlockedAt: Date | null }) {
    const lifecycleLocked = ['IN_PROGRESS', 'COMPLETED', 'ARCHIVED'].includes(training.status);
    if (!lifecycleLocked && !training.lockedAt) return false;
    return !training.unlockedAt || (training.lockedAt != null && training.unlockedAt <= training.lockedAt);
  }

  private assertCourseMutable(
    training: { status: string; lockedAt: Date | null; unlockedAt: Date | null },
    actor: TrainingAdminUser,
    action: string,
  ) {
    if (!this.isCourseLocked(training)) return;
    if (actor.permissions?.includes('training.course.override')) {
      throw new BadRequestException(`دوره قفل است. ابتدا با ثبت دلیل، قفل را باز کنید و سپس ${action} را انجام دهید.`);
    }
    throw new ForbiddenException(`پس از شروع دوره امکان ${action} وجود ندارد.`);
  }

  private recordCourseAudit(trainingId: string, actorUserId: string | undefined, action: string, reason?: string, changes?: Record<string, unknown>) {
    return this.prisma.trainingCourseAudit.create({
      data: { trainingId, actorUserId: actorUserId || null, action, reason: reason || null, changes: changes ? changes as Prisma.InputJsonValue : undefined },
    });
  }

  private mapSignatoryDto(dto: UpsertTrainingSignatoryDto): Prisma.TrainingCertificateSignatoryUncheckedCreateInput {
    return {
      fullName: dto.fullName.trim(),
      jobTitle: dto.jobTitle.trim(),
      signatureUrl: dto.signatureUrl || null,
      stampUrl: dto.stampUrl || null,
      isActive: dto.isActive ?? true,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      sortOrder: dto.sortOrder ?? 0,
    };
  }

  private async buildCertificateSnapshot(participantId: string, templateId?: string | null) {
    const participant = await this.prisma.inPersonTrainingParticipant.findUniqueOrThrow({
      where: { id: participantId },
      include: {
        training: true,
        directoryUser: { select: { username: true, department: true, title: true } },
      },
    });
    const template = templateId ? await this.prisma.trainingCertificateTemplate.findUnique({
      where: { id: templateId },
      include: { signatories: { include: { signatory: true }, orderBy: { sortOrder: 'asc' } } },
    }) : null;
    return {
      participant: { displayName: participant.displayName, personnelCode: participant.personnelCode, email: participant.email, username: participant.directoryUser?.username, department: participant.directoryUser?.department },
      training: { id: participant.training.id, courseCode: participant.training.courseCode, title: participant.training.title, instructorName: participant.training.instructorName, organizerDepartment: participant.training.organizerDepartment, location: participant.training.location, startDate: participant.training.startDate, endDate: participant.training.endDate, durationHours: participant.training.durationHours },
      result: { score: participant.score, result: participant.result, attendanceStatus: participant.attendanceStatus },
      template: template ? { id: template.id, title: template.title, backgroundUrl: template.backgroundUrl, layout: template.layout } : null,
      signatories: template?.signatories.map((item) => ({ fullName: item.signatory.fullName, jobTitle: item.signatory.jobTitle, signatureUrl: item.signatory.signatureUrl, stampUrl: item.signatory.stampUrl, position: item.position })) || [],
      generatedAt: new Date().toISOString(),
    };
  }

  private async nextCertificateNumber(training: { id: string; courseCode: string; startDate: Date; certificateNumberStart: number; certificateNumberStrategy: TrainingCertificateNumberStrategy; certificateNumberPattern: string }) {
    const now = new Date();
    const year = now.getFullYear();
    const countWhere: Prisma.TrainingCertificateWhereInput = training.certificateNumberStrategy === TrainingCertificateNumberStrategy.COURSE_SEQUENTIAL
      ? { participant: { trainingId: training.id } }
      : training.certificateNumberStrategy === TrainingCertificateNumberStrategy.YEARLY_SEQUENTIAL
        ? { issuedAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } }
        : {};
    const baseSequence = training.certificateNumberStart + await this.prisma.trainingCertificate.count({ where: countWhere });
    if (training.certificateNumberStrategy === TrainingCertificateNumberStrategy.RANDOM) return `AGTPS-${year}-${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
    const pattern = training.certificateNumberStrategy === TrainingCertificateNumberStrategy.SEQUENTIAL ? "AGTPS-{SEQ:7}"
      : training.certificateNumberStrategy === TrainingCertificateNumberStrategy.YEARLY_SEQUENTIAL ? "AGTPS-{YEAR}-{SEQ:5}"
        : training.certificateNumberStrategy === TrainingCertificateNumberStrategy.COURSE_SEQUENTIAL ? "AGTPS-{COURSE}-{SEQ:4}"
          : training.certificateNumberPattern;
    for (let offset = 0; offset < 10000; offset += 1) {
      const sequence = baseSequence + offset;
      const candidate = pattern.replaceAll("{YEAR}", String(year)).replaceAll("{COURSE}", training.courseCode.toUpperCase()).replace(/\{SEQ(?::(\d+))?\}/g, (_match, width) => String(sequence).padStart(Number(width || 1), "0"));
      const duplicate = await this.prisma.trainingCertificate.findUnique({ where: { certificateNumber: candidate }, select: { id: true } });
      if (!duplicate) return candidate;
    }
    throw new BadRequestException("شماره گواهی یکتا تولید نشد؛ الگوی شماره‌گذاری را بررسی کنید.");
  }

  private async issueAutomaticCertificateForParticipant(participantId: string, forceApproval = false) {
    const participant = await this.prisma.inPersonTrainingParticipant.findUniqueOrThrow({
      where: { id: participantId },
      include: { training: true, certificates: true },
    });
    const training = participant.training;
    if (!training.hasCertificate || training.certificateMode === TrainingCertificateMode.NONE || training.certificateMode === TrainingCertificateMode.OFFLINE_UPLOAD) return null;
    if (training.certificateMode === TrainingCertificateMode.ONLINE_APPROVAL && !forceApproval) return null;
    if (participant.certificates.length) return null;
    if (training.certificateRequiresPass && participant.result !== 'PASSED') return null;
    if (training.certificateRequiresCompletion && participant.result !== 'PASSED' && participant.attendanceStatus !== 'ATTENDED') return null;
    const certificateNumber = await this.nextCertificateNumber(training);
    const snapshot = await this.buildCertificateSnapshot(participant.id, training.certificateTemplateId);
    const certificate = await this.prisma.$transaction(async (tx) => {
      const certificate = await tx.trainingCertificate.create({
        data: { participantId: participant.id, templateId: training.certificateTemplateId, certificateNumber, title: training.title, source: TrainingCertificateSource.GENERATED, snapshot: snapshot as Prisma.InputJsonValue },
      });
      await tx.inPersonTrainingParticipant.update({ where: { id: participant.id }, data: { certificateNumber } });
      return certificate;
    });
    await this.notifyTrainingParticipant(
      participant.id,
      `training.certificate.${certificate.id}`,
      `گواهی دوره «${training.title}» صادر شد`,
      `شماره گواهی: ${certificate.certificateNumber}`,
    );
    return certificate;
  }

  private async assertUniqueCourseCode(courseCode: string, excludeId?: string) {
    const normalized = courseCode.trim().toUpperCase();
    const duplicate = await this.prisma.inPersonTraining.findFirst({ where: { courseCode: normalized, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } });
    if (duplicate) throw new BadRequestException("کد دوره تکراری است؛ یک کد یکتا وارد کنید.");
    return normalized;
  }

  private isTrainingVisibleToParticipants(status: string) {
    return ['APPROVED', 'OPEN', 'IN_PROGRESS', 'COMPLETED'].includes(status);
  }

  private async queueTrainingLifecycleNotifications(
    trainingId: string,
    event: 'approved' | 'updated' | 'cancelled',
    onlyDirectoryUserIds?: string[],
  ) {
    const training = await this.prisma.inPersonTraining.findUniqueOrThrow({
      where: { id: trainingId },
      include: {
        participants: {
          where: onlyDirectoryUserIds?.length
            ? { directoryUserId: { in: onlyDirectoryUserIds } }
            : undefined,
        },
      },
    });
    const targetUrl = '/admin/profile?section=training';
    const dateLabel = training.startDate.toLocaleString('fa-IR', {
      timeZone: 'Asia/Tehran',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    if (event === 'cancelled') {
      await this.prisma.portalNotification.deleteMany({
        where: { trainingId, eventKey: { startsWith: 'training.reminder.' }, sentAt: null },
      });
    }

    for (const participant of training.participants) {
      const eventKey = `training.${event}`;
      const existing = await this.prisma.portalNotification.findFirst({
        where: {
          trainingId,
          eventKey,
          recipientDirectoryUserId: participant.directoryUserId,
          recipientEmail: participant.directoryUserId ? undefined : participant.email,
        },
      });
      if (!existing || event !== 'approved') {
        const title = event === 'approved'
          ? `دوره «${training.title}» تأیید شد`
          : event === 'cancelled'
            ? `دوره «${training.title}» لغو شد`
            : `اطلاعات دوره «${training.title}» تغییر کرد`;
        await this.notifications.createPortalNotification({
          type: 'TRAINING',
          title,
          body: event === 'cancelled'
            ? 'این دوره توسط واحد آموزش لغو شده است.'
            : `زمان شروع: ${dateLabel}${training.location ? ` — محل: ${training.location}` : ''}`,
          recipientDirectoryUserId: participant.directoryUserId,
          recipientEmail: participant.email,
          trainingId,
          eventKey,
          targetUrl,
          sentAt: new Date(),
        });
      }
    }

    if (event === 'cancelled') return;
    await this.prisma.portalNotification.deleteMany({
      where: { trainingId, eventKey: { startsWith: 'training.reminder.' }, sentAt: null },
    });
    const now = Date.now();
    for (const minutes of [...new Set(training.notificationReminderMinutes)].filter((value) => value > 0)) {
      const scheduledAt = new Date(training.startDate.getTime() - minutes * 60_000);
      if (scheduledAt.getTime() <= now) continue;
      for (const participant of training.participants) {
        await this.notifications.createPortalNotification({
          type: 'TRAINING',
          title: `یادآوری دوره «${training.title}»`,
          body: `شروع دوره در ${dateLabel}${training.location ? ` — محل: ${training.location}` : ''}`,
          recipientDirectoryUserId: participant.directoryUserId,
          recipientEmail: participant.email,
          trainingId,
          eventKey: `training.reminder.${minutes}`,
          targetUrl,
          scheduledAt,
        });
      }
    }
  }

  private async notifyTrainingParticipant(
    participantId: string,
    eventKey: string,
    title: string,
    body: string,
  ) {
    const participant = await this.prisma.inPersonTrainingParticipant.findUniqueOrThrow({
      where: { id: participantId },
      include: { training: { select: { id: true } } },
    });
    await this.notifications.createPortalNotification({
      type: 'TRAINING',
      title,
      body,
      recipientDirectoryUserId: participant.directoryUserId,
      recipientEmail: participant.email,
      trainingId: participant.training.id,
      eventKey,
      targetUrl: '/admin/profile?section=training',
      sentAt: new Date(),
    });
  }

  async createInPersonTraining(dto: CreateInPersonTrainingDto, actor: TrainingAdminUser = {}) {
    dto.courseCode = await this.assertUniqueCourseCode(dto.courseCode);
    const { directoryUserIds = [], ...courseDto } = dto;
    const created = await this.prisma.inPersonTraining.create({
      data: this.mapInPersonTrainingCreateDto(courseDto),
      include: { category: true, participants: true },
    });
    if (directoryUserIds.length) await this.enrollDirectoryUsers(created.id, directoryUserIds, actor);
    await this.recordCourseAudit(created.id, actor.id, 'COURSE_CREATED', undefined, { title: created.title });
    return this.findInPersonTrainingDetail(created.id);
  }

  async updateInPersonTraining(id: string, dto: UpdateInPersonTrainingDto, actor: TrainingAdminUser = {}) {
    if (dto.courseCode) dto.courseCode = await this.assertUniqueCourseCode(dto.courseCode, id);
    const existing = await this.prisma.inPersonTraining.findUniqueOrThrow({ where: { id } });
    this.assertCourseMutable(existing, actor, 'ویرایش دوره');
    const { directoryUserIds: _directoryUserIds, ...courseDto } = dto;
    const nextLocks = courseDto.status === 'IN_PROGRESS' || courseDto.status === 'COMPLETED' || courseDto.status === 'ARCHIVED';
    const updated = await this.prisma.inPersonTraining.update({
      where: {
        id,
      },
      data: { ...this.mapInPersonTrainingUpdateDto(courseDto), ...(nextLocks ? { lockedAt: new Date(), unlockedAt: null, unlockReason: null, unlockedByUserId: null } : {}) },
      include: {
        category: true,
        participants: true,
      },
    });
    await this.recordCourseAudit(id, actor.id, 'COURSE_UPDATED', undefined, courseDto as unknown as Record<string, unknown>);
    if (updated.status === 'CANCELLED' && existing.status !== 'CANCELLED') {
      await this.queueTrainingLifecycleNotifications(id, 'cancelled');
    } else if (this.isTrainingVisibleToParticipants(updated.status)) {
      const becameVisible = !this.isTrainingVisibleToParticipants(existing.status);
      const relevantChange =
        becameVisible ||
        existing.title !== updated.title ||
        existing.startDate.getTime() !== updated.startDate.getTime() ||
        existing.endDate?.getTime() !== updated.endDate?.getTime() ||
        existing.location !== updated.location ||
        existing.notificationReminderMinutes.join(',') !== updated.notificationReminderMinutes.join(',');
      if (relevantChange) {
        await this.queueTrainingLifecycleNotifications(id, becameVisible ? 'approved' : 'updated');
      }
    }
    return updated;
  }

  async unlockInPersonTraining(id: string, reason: string, actor: { id?: string }) {
    if (reason.trim().length < 5) throw new BadRequestException('دلیل بازکردن قفل باید حداقل ۵ کاراکتر باشد.');
    const training = await this.prisma.inPersonTraining.update({
      where: { id },
      data: { unlockedAt: new Date(), unlockedByUserId: actor.id || null, unlockReason: reason.trim() },
    });
    await this.recordCourseAudit(id, actor.id, 'COURSE_UNLOCKED', reason.trim());
    return training;
  }

  async removeInPersonTraining(id: string) {
    const training = await this.prisma.inPersonTraining.findUniqueOrThrow({ where: { id }, include: { _count: { select: { participants: true } }, exam: { select: { id: true } } } });
    if (training._count.participants || training.exam || ['IN_PROGRESS', 'COMPLETED', 'ARCHIVED'].includes(training.status)) {
      return this.prisma.inPersonTraining.update({ where: { id }, data: { status: 'ARCHIVED', lockedAt: new Date(), unlockedAt: null } });
    }
    return this.prisma.inPersonTraining.delete({ where: { id } });
  }

  async createInPersonParticipant(
    trainingId: string,
    dto: CreateInPersonParticipantDto,
    actor: TrainingAdminUser = {},
  ) {
    const training = await this.prisma.inPersonTraining.findUniqueOrThrow({ where: { id: trainingId } });
    this.assertCourseMutable(training, actor, 'افزودن شرکت‌کننده');
    const participant = await this.prisma.inPersonTrainingParticipant.create({
      data: this.mapInPersonParticipantCreateDto(trainingId, dto),
    });
    await this.recordCourseAudit(trainingId, actor.id, 'PARTICIPANT_ADDED', undefined, { participantId: participant.id, displayName: participant.displayName });
    return participant;
  }

  async updateInPersonParticipant(id: string, dto: UpdateInPersonParticipantDto, actor: TrainingAdminUser = {}) {
    const participant = await this.prisma.inPersonTrainingParticipant.findUniqueOrThrow({ where: { id }, include: { training: true } });
    this.assertCourseMutable(participant.training, actor, 'ویرایش شرکت‌کننده');
    const updated = await this.prisma.inPersonTrainingParticipant.update({
      where: {
        id,
      },
      data: this.mapInPersonParticipantUpdateDto(dto),
    });
    await this.recordCourseAudit(participant.trainingId, actor.id, 'PARTICIPANT_UPDATED', undefined, { participantId: id, ...dto });
    return updated;
  }

  async removeInPersonParticipant(id: string, actor: TrainingAdminUser = {}) {
    const participant = await this.prisma.inPersonTrainingParticipant.findUniqueOrThrow({ where: { id }, include: { training: true, _count: { select: { examAttempts: true, certificates: true } } } });
    this.assertCourseMutable(participant.training, actor, 'حذف شرکت‌کننده');
    if (participant._count.examAttempts || participant._count.certificates) throw new BadRequestException('شرکت‌کننده دارای آزمون یا گواهی است و قابل حذف نیست.');
    const removed = await this.prisma.inPersonTrainingParticipant.delete({
      where: {
        id,
      },
    });
    await this.recordCourseAudit(participant.trainingId, actor.id, 'PARTICIPANT_REMOVED', undefined, { participantId: id, displayName: participant.displayName });
    return removed;
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

  async prepareSmbPreview(
    id: string,
    user: TrainingContentUser,
    requestedPath?: string,
  ) {
    const content = await this.prepareSmbContent(id, user, requestedPath);
    const extension = path.extname(content.filename).toLowerCase();
    if (extension === '.pdf') return content;
    if (!officePreviewExtensions.has(extension)) {
      throw new NotFoundException('Preview is not available for this file type.');
    }

    const previewPath = content.path.replace(/\.[^.]+$/, '.pdf');
    let previewStat = await stat(previewPath).catch(() => null);
    if (!previewStat?.isFile()) {
      await execFileAsync(
        'libreoffice',
        [
          '--headless',
          '--nologo',
          '--nodefault',
          '--nofirststartwizard',
          '--convert-to',
          'pdf',
          '--outdir',
          path.dirname(content.path),
          content.path,
        ],
        { timeout: 120_000 },
      );
      previewStat = await stat(previewPath).catch(() => null);
    }
    if (!previewStat?.isFile()) {
      throw new NotFoundException('Office preview could not be generated.');
    }
    return {
      path: previewPath,
      size: previewStat.size,
      filename: `${path.parse(content.filename).name}.pdf`,
      contentType: 'application/pdf',
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
