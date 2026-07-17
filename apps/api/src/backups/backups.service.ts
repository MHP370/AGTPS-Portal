import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  StreamableFile,
} from '@nestjs/common';
import {
  BackupScheduleFrequency,
  BackupRestoreStatus,
  BackupStatus,
  BackupType,
  Prisma,
} from '@prisma/client';
import { createReadStream } from 'fs';
import {
  cp,
  mkdir,
  rm,
  stat,
  unlink,
  writeFile,
} from 'fs/promises';
import { basename, dirname, join, resolve } from 'path';
import { spawn } from 'child_process';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBackupDto } from './dto/create-backup.dto';
import { RestoreBackupDto } from './dto/restore-backup.dto';
import { UpdateBackupSettingsDto } from './dto/update-backup-settings.dto';

@Injectable()
export class BackupsService implements OnModuleInit, OnModuleDestroy {
  private scheduler?: NodeJS.Timeout;
  private autoBackupRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    this.scheduler = setInterval(() => {
      void this.runAutoBackupIfDue();
    }, 60_000);

    void this.runAutoBackupIfDue();
  }

  onModuleDestroy() {
    if (this.scheduler) clearInterval(this.scheduler);
  }

  findAll() {
    return this.prisma.backupJob.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });
  }

  async getSettings() {
    const settings = await this.prisma.backupSetting.upsert({
      where: {
        id: 1,
      },
      update: {},
      create: {
        id: 1,
        nextRunAt: this.calculateNextRunAt({
          frequency: BackupScheduleFrequency.DAILY,
          scheduleTime: '02:00',
          weeklyDayOfWeek: 6,
          monthlyDayOfMonth: 1,
        }),
      },
    });

    if (!settings.nextRunAt) {
      return this.prisma.backupSetting.update({
        where: {
          id: 1,
        },
        data: {
          nextRunAt: this.calculateNextRunAt(settings),
        },
      });
    }

    return settings;
  }

  async updateSettings(dto: UpdateBackupSettingsDto) {
    const includeDatabase = dto.includeDatabase;
    const includeUploads = dto.includeUploads;

    if (includeDatabase === false && includeUploads === false) {
      throw new BadRequestException('حداقل یک بخش برای بکاپ خودکار باید انتخاب شود.');
    }

    const current = await this.getSettings();
    const nextSettings = {
      ...current,
      ...dto,
      weeklyDayOfWeek: dto.weeklyDayOfWeek ?? current.weeklyDayOfWeek,
      monthlyDayOfMonth: dto.monthlyDayOfMonth ?? current.monthlyDayOfMonth,
      scheduleTime: dto.scheduleTime ?? current.scheduleTime,
      frequency: dto.frequency ?? current.frequency,
    };

    return this.prisma.backupSetting.update({
      where: {
        id: 1,
      },
      data: {
        ...dto,
        nextRunAt: this.calculateNextRunAt(nextSettings),
      },
    });
  }

  async createManualBackup(dto: CreateBackupDto) {
    const includeDatabase =
      dto.includeDatabase ?? dto.type !== BackupType.FILES;
    const includeUploads =
      dto.includeUploads ?? dto.type !== BackupType.DATABASE;

    if (!includeDatabase && !includeUploads) {
      throw new BadRequestException('حداقل یک بخش برای بکاپ باید انتخاب شود.');
    }

    const job = await this.prisma.backupJob.create({
      data: {
        type: dto.type ?? BackupType.FULL,
        includeDatabase,
        includeUploads,
        notifyEmail: dto.notifyEmail,
        status: BackupStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    try {
      const result = await this.runBackup(job.id, {
        includeDatabase,
        includeUploads,
      });

      const updated = await this.prisma.backupJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: BackupStatus.SUCCESS,
          fileName: result.fileName,
          filePath: result.filePath,
          fileSize: result.fileSize,
          finishedAt: new Date(),
          metadata: result.metadata as Prisma.InputJsonValue,
        },
      });

      await this.notifyBackupResult(updated.id, true);
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const failed = await this.prisma.backupJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: BackupStatus.FAILED,
          error: message,
          finishedAt: new Date(),
        },
      });

      await this.notifyBackupResult(failed.id, false);
      return failed;
    }
  }

  private async runAutoBackupIfDue() {
    if (this.autoBackupRunning) return;

    const settings = await this.getSettings();

    if (!settings.autoEnabled) return;

    const nextRunAt =
      settings.nextRunAt ?? this.calculateNextRunAt(settings);

    if (nextRunAt.getTime() > Date.now()) return;

    this.autoBackupRunning = true;

    try {
      const notifyEmails = this.parseNotifyEmails(settings.notifyEmails);
      const backup = await this.createManualBackup({
        type: settings.type,
        includeDatabase: settings.includeDatabase,
        includeUploads: settings.includeUploads,
        notifyEmail: notifyEmails[0],
      });

      for (const email of notifyEmails.slice(1)) {
        await this.notifyBackupResultToEmail(backup.id, email);
      }

      await this.applyRetention(settings.retentionCount);
      await this.prisma.backupSetting.update({
        where: {
          id: 1,
        },
        data: {
          lastRunAt: new Date(),
          nextRunAt: this.calculateNextRunAt(settings, true),
        },
      });
    } finally {
      this.autoBackupRunning = false;
    }
  }

  async streamBackup(id: string) {
    const backup = await this.prisma.backupJob.findUnique({
      where: {
        id,
      },
    });

    if (!backup || backup.status !== BackupStatus.SUCCESS || !backup.filePath) {
      throw new NotFoundException('Backup file was not found.');
    }

    const filePath = this.resolveInsideBackupRoot(backup.filePath);
    const fileStat = await stat(filePath).catch(() => null);

    if (!fileStat?.isFile()) {
      throw new NotFoundException('Backup file was not found on disk.');
    }

    return {
      file: new StreamableFile(createReadStream(filePath)),
      filename: backup.fileName || basename(filePath),
      contentLength: fileStat.size,
    };
  }

  async remove(id: string) {
    const backup = await this.prisma.backupJob.findUnique({
      where: {
        id,
      },
    });

    if (!backup) {
      throw new NotFoundException('Backup was not found.');
    }

    if (backup.filePath) {
      await unlink(this.resolveInsideBackupRoot(backup.filePath)).catch(
        () => undefined,
      );
    }

    return this.prisma.backupJob.update({
      where: {
        id,
      },
      data: {
        status: BackupStatus.DELETED,
        filePath: null,
      },
    });
  }

  findRestoreJobs() {
    return this.prisma.backupRestoreJob.findMany({
      include: {
        backup: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });
  }

  async restore(id: string, dto: RestoreBackupDto) {
    if (dto.confirmation !== 'RESTORE') {
      throw new BadRequestException('برای بازگردانی باید عبارت RESTORE وارد شود.');
    }

    const restoreDatabase = dto.restoreDatabase ?? true;
    const restoreUploads = dto.restoreUploads ?? true;

    if (!restoreDatabase && !restoreUploads) {
      throw new BadRequestException('حداقل یک بخش برای بازگردانی باید انتخاب شود.');
    }

    const backup = await this.prisma.backupJob.findUnique({
      where: {
        id,
      },
    });

    if (!backup || backup.status !== BackupStatus.SUCCESS || !backup.filePath) {
      throw new NotFoundException('Backup قابل بازگردانی پیدا نشد.');
    }

    if (restoreDatabase && !backup.includeDatabase) {
      throw new BadRequestException('این بکاپ شامل دیتابیس نیست.');
    }

    if (restoreUploads && !backup.includeUploads) {
      throw new BadRequestException('این بکاپ شامل uploads نیست.');
    }

    const backupFilePath = this.resolveInsideBackupRoot(backup.filePath);
    const backupStat = await stat(backupFilePath).catch(() => null);

    if (!backupStat?.isFile()) {
      throw new NotFoundException('فایل بکاپ روی دیسک پیدا نشد.');
    }

    const restoreJob = await this.prisma.backupRestoreJob.create({
      data: {
        backupId: backup.id,
        restoreDatabase,
        restoreUploads,
        status: BackupRestoreStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    try {
      const emergencyBackup = await this.createManualBackup({
        type: BackupType.FULL,
        includeDatabase: true,
        includeUploads: true,
      });

      await this.prisma.backupRestoreJob.update({
        where: {
          id: restoreJob.id,
        },
        data: {
          emergencyBackupId: emergencyBackup.id,
        },
      });

      if (emergencyBackup.status !== BackupStatus.SUCCESS) {
        throw new BadRequestException(
          `بکاپ اضطراری قبل از Restore ناموفق بود: ${
            emergencyBackup.error || 'خطای نامشخص'
          }`,
        );
      }

      const workDir = join(this.getBackupRoot(), `.restore-${restoreJob.id}`);
      await rm(workDir, {
        recursive: true,
        force: true,
      });
      await mkdir(workDir, {
        recursive: true,
      });

      try {
        await this.runCommand('tar', ['-xzf', backupFilePath, '-C', workDir]);

        const restoredParts: string[] = [];

        if (restoreUploads) {
          await this.restoreUploadsFrom(workDir);
          restoredParts.push('uploads');
        }

        if (restoreDatabase) {
          await this.restoreDatabaseFrom(workDir);
          restoredParts.push('database');
        }

        return await this.prisma.backupRestoreJob.update({
          where: {
            id: restoreJob.id,
          },
          data: {
            status: BackupRestoreStatus.SUCCESS,
            finishedAt: new Date(),
            metadata: {
              restoredParts,
              sourceBackupId: backup.id,
              sourceFileName: backup.fileName,
              emergencyBackupId: emergencyBackup.id,
            } as Prisma.InputJsonValue,
          },
          include: {
            backup: true,
          },
        });
      } finally {
        await rm(workDir, {
          recursive: true,
          force: true,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      return this.prisma.backupRestoreJob.update({
        where: {
          id: restoreJob.id,
        },
        data: {
          status: BackupRestoreStatus.FAILED,
          error: message,
          finishedAt: new Date(),
        },
        include: {
          backup: true,
        },
      });
    }
  }

  private async runBackup(
    jobId: string,
    options: {
      includeDatabase: boolean;
      includeUploads: boolean;
    },
  ) {
    const backupRoot = this.getBackupRoot();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const workDir = join(backupRoot, `.tmp-${jobId}`);
    const fileName = `agtps-backup-${stamp}-${jobId}.tar.gz`;
    const filePath = join(backupRoot, fileName);

    await mkdir(workDir, {
      recursive: true,
    });
    await mkdir(dirname(filePath), {
      recursive: true,
    });

    const metadata = {
      jobId,
      createdAt: new Date().toISOString(),
      includeDatabase: options.includeDatabase,
      includeUploads: options.includeUploads,
    };

    await writeFile(
      join(workDir, 'manifest.json'),
      JSON.stringify(metadata, null, 2),
      'utf8',
    );

    if (options.includeDatabase) {
      await this.runCommand('pg_dump', [
        process.env.DATABASE_URL || '',
        '--file',
        join(workDir, 'database.sql'),
        '--no-owner',
        '--no-privileges',
        '--clean',
        '--if-exists',
      ]);
    }

    if (options.includeUploads) {
      const uploadsRoot = this.getUploadsRoot();
      const uploadsStat = await stat(uploadsRoot).catch(() => null);

      if (uploadsStat?.isDirectory()) {
        await cp(uploadsRoot, join(workDir, 'uploads'), {
          recursive: true,
        });
      }
    }

    await this.runCommand('tar', [
      '-czf',
      filePath,
      '-C',
      workDir,
      '.',
    ]);

    const fileStat = await stat(filePath);
    await rm(workDir, {
      recursive: true,
      force: true,
    });

    return {
      fileName,
      filePath,
      fileSize: fileStat.size,
      metadata,
    };
  }

  private async notifyBackupResult(id: string, success: boolean) {
    const backup = await this.prisma.backupJob.findUnique({
      where: {
        id,
      },
    });

    if (!backup?.notifyEmail) return;

    await this.notifyBackupResultToEmail(id, backup.notifyEmail, success);
  }

  private async notifyBackupResultToEmail(
    id: string,
    email: string,
    successOverride?: boolean,
  ) {
    const backup = await this.prisma.backupJob.findUnique({
      where: {
        id,
      },
    });

    if (!backup) return;

    const success = successOverride ?? backup.status === BackupStatus.SUCCESS;

    await this.notificationsService.dispatchEvent({
      eventKey: 'backup.result',
      email: {
        fallbackTemplateKey: success ? 'backup-success' : 'backup-failed',
        recipientEmail: email,
        subject: success
          ? 'بکاپ AGTPS با موفقیت انجام شد'
          : 'خطا در بکاپ AGTPS',
        htmlBody: success
          ? '<p dir="rtl">بکاپ با موفقیت انجام شد.</p>'
          : `<p dir="rtl">بکاپ انجام نشد: ${backup.error ?? ''}</p>`,
        variables: {
          BackupTime: backup.finishedAt?.toLocaleString('fa-IR') ?? '',
          BackupSize: backup.fileSize
            ? `${Math.round(Number(backup.fileSize) / 1024 / 1024)} MB`
            : '-',
          BackupPath: backup.fileName ?? '-',
          ErrorMessage: backup.error ?? '',
          ButtonText: 'مشاهده بکاپ‌ها',
          ButtonUrl: '/admin/backups',
        },
      },
    });

    await this.notificationsService.processEmailQueue(5).catch(() => undefined);
  }

  private async applyRetention(retentionCount: number) {
    const keep = Math.max(1, retentionCount || 10);
    const oldBackups = await this.prisma.backupJob.findMany({
      where: {
        status: BackupStatus.SUCCESS,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: keep,
    });

    for (const backup of oldBackups) {
      if (backup.filePath) {
        await unlink(this.resolveInsideBackupRoot(backup.filePath)).catch(
          () => undefined,
        );
      }

      await this.prisma.backupJob.update({
        where: {
          id: backup.id,
        },
        data: {
          status: BackupStatus.DELETED,
          filePath: null,
        },
      });
    }
  }

  private calculateNextRunAt(
    settings: {
      frequency: BackupScheduleFrequency;
      scheduleTime: string;
      weeklyDayOfWeek: number;
      monthlyDayOfMonth: number;
    },
    forceNext = false,
  ) {
    const now = new Date();
    const [hour = '2', minute = '0'] = settings.scheduleTime.split(':');
    const targetHour = Number(hour);
    const targetMinute = Number(minute);

    if (settings.frequency === BackupScheduleFrequency.HOURLY) {
      const next = new Date(now);
      next.setMinutes(targetMinute, 0, 0);
      if (forceNext || next.getTime() <= now.getTime()) {
        next.setHours(next.getHours() + 1);
      }
      return next;
    }

    if (settings.frequency === BackupScheduleFrequency.WEEKLY) {
      const next = new Date(now);
      next.setHours(targetHour, targetMinute, 0, 0);
      const targetDay = Math.min(6, Math.max(0, settings.weeklyDayOfWeek));
      const diff = (targetDay - next.getDay() + 7) % 7;
      next.setDate(next.getDate() + diff);
      if (forceNext || next.getTime() <= now.getTime()) {
        next.setDate(next.getDate() + 7);
      }
      return next;
    }

    if (settings.frequency === BackupScheduleFrequency.MONTHLY) {
      const next = new Date(now);
      next.setHours(targetHour, targetMinute, 0, 0);
      next.setDate(
        this.clampDayOfMonth(
          next.getFullYear(),
          next.getMonth(),
          settings.monthlyDayOfMonth,
        ),
      );
      if (forceNext || next.getTime() <= now.getTime()) {
        next.setMonth(next.getMonth() + 1);
        next.setDate(
          this.clampDayOfMonth(
            next.getFullYear(),
            next.getMonth(),
            settings.monthlyDayOfMonth,
          ),
        );
      }
      return next;
    }

    const next = new Date(now);
    next.setHours(targetHour, targetMinute, 0, 0);
    if (forceNext || next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  private clampDayOfMonth(year: number, month: number, day: number) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return Math.min(lastDay, Math.max(1, day));
  }

  private parseNotifyEmails(value?: string | null) {
    return (value || '')
      .split(/[,\n;]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private getBackupRoot() {
    return resolve(process.env.BACKUP_DIR || '/var/lib/agtps/backups');
  }

  private getUploadsRoot() {
    const cwd = process.cwd();

    if (cwd.endsWith('/apps/api')) {
      return resolve(cwd, '../web/public/uploads');
    }

    return resolve(cwd, 'apps/web/public/uploads');
  }

  private async restoreUploadsFrom(workDir: string) {
    const sourceUploads = resolve(workDir, 'uploads');
    const sourceStat = await stat(sourceUploads).catch(() => null);

    if (!sourceStat?.isDirectory()) {
      throw new BadRequestException('فایل بکاپ پوشه uploads ندارد.');
    }

    const uploadsRoot = this.getUploadsRoot();
    await mkdir(dirname(uploadsRoot), {
      recursive: true,
    });
    await rm(uploadsRoot, {
      recursive: true,
      force: true,
    });
    await cp(sourceUploads, uploadsRoot, {
      recursive: true,
    });
  }

  private async restoreDatabaseFrom(workDir: string) {
    const databaseFile = resolve(workDir, 'database.sql');
    const databaseStat = await stat(databaseFile).catch(() => null);

    if (!databaseStat?.isFile()) {
      throw new BadRequestException('فایل بکاپ database.sql ندارد.');
    }

    await this.runCommand('psql', [
      process.env.DATABASE_URL || '',
      '-v',
      'ON_ERROR_STOP=1',
      '--file',
      databaseFile,
    ]);
  }

  private resolveInsideBackupRoot(filePath: string) {
    const root = this.getBackupRoot();
    const resolved = resolve(filePath);

    if (resolved !== root && !resolved.startsWith(`${root}/`)) {
      throw new BadRequestException('Invalid backup path.');
    }

    return resolved;
  }

  private runCommand(command: string, args: string[]) {
    return new Promise<void>((resolveCommand, rejectCommand) => {
      const child = spawn(command, args, {
        env: process.env,
      });
      let stderr = '';

      child.stderr.on('data', (chunk) => {
        stderr += String(chunk);
      });

      child.on('error', (error) => {
        rejectCommand(
          new Error(
            `${command} اجرا نشد. روی سرور اصلی نصب بودن ابزار را بررسی کنید. ${error.message}`,
          ),
        );
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolveCommand();
          return;
        }

        rejectCommand(
          new Error(
            `${command} با خطا تمام شد: ${stderr || `exit code ${code}`}`,
          ),
        );
      });
    });
  }
}
