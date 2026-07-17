import { Injectable } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { BackupRestoreStatus, BackupStatus } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';

const execFileAsync = promisify(execFile);

type HealthState = 'UP' | 'DEGRADED' | 'DOWN';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  getLiveness() {
    return {
      status: 'UP' as const,
      service: 'agtps-api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  async getReadiness() {
    const [
      database,
      uploadsStorage,
      backupStorage,
      smtp,
      latestBackup,
      latestRestore,
      systemStatuses,
      disk,
      env,
    ] = await Promise.all([
      this.checkDatabase(),
      this.checkWritableDirectory(this.getUploadsRoot(), 'uploads'),
      this.checkWritableDirectory(this.getBackupRoot(), 'backup-dir'),
      this.checkSmtp(),
      this.getLatestBackup(),
      this.getLatestRestore(),
      this.getSystemStatusSummary(),
      this.checkDisk(this.getBackupRoot()),
      this.checkEnvironment(),
    ]);

    const checks = [
      database,
      uploadsStorage,
      backupStorage,
      smtp,
      latestBackup,
      latestRestore,
      systemStatuses,
      disk,
      env,
    ];
    const status = this.reduceStatus(checks.map((check) => check.status));

    return {
      status,
      service: 'agtps-api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      checks,
    };
  }

  private async checkDatabase() {
    const startedAt = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        key: 'database',
        title: 'Database Connection',
        status: 'UP' as HealthState,
        responseTimeMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        key: 'database',
        title: 'Database Connection',
        status: 'DOWN' as HealthState,
        error: this.getErrorMessage(error),
      };
    }
  }

  private async checkWritableDirectory(path: string, key: string) {
    const probeFile = join(path, `.agtps-health-${Date.now()}.tmp`);

    try {
      await mkdir(path, {
        recursive: true,
      });
      await writeFile(probeFile, 'ok', 'utf8');
      await unlink(probeFile).catch(() => undefined);

      return {
        key,
        title: key === 'uploads' ? 'Uploads Storage' : 'Backup Storage',
        status: 'UP' as HealthState,
        path,
      };
    } catch (error) {
      return {
        key,
        title: key === 'uploads' ? 'Uploads Storage' : 'Backup Storage',
        status: 'DOWN' as HealthState,
        path,
        error: this.getErrorMessage(error),
      };
    }
  }

  private async checkSmtp() {
    const [activeCount, failedCount] = await Promise.all([
      this.prisma.notificationSmtpServer.count({
        where: {
          isActive: true,
        },
      }),
      this.prisma.notificationEmailQueue.count({
        where: {
          status: 'FAILED',
        },
      }),
    ]);

    return {
      key: 'smtp',
      title: 'SMTP Configuration',
      status: activeCount > 0 ? ('UP' as HealthState) : ('DEGRADED' as HealthState),
      activeCount,
      failedQueueCount: failedCount,
      message:
        activeCount > 0
          ? 'At least one SMTP server is active.'
          : 'No active SMTP server is configured.',
    };
  }

  private async getLatestBackup() {
    const latest = await this.prisma.backupJob.findFirst({
      where: {
        status: {
          in: [BackupStatus.SUCCESS, BackupStatus.FAILED],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!latest) {
      return {
        key: 'latest-backup',
        title: 'Latest Backup',
        status: 'DEGRADED' as HealthState,
        message: 'No backup has been created yet.',
      };
    }

    return {
      key: 'latest-backup',
      title: 'Latest Backup',
      status:
        latest.status === BackupStatus.SUCCESS
          ? ('UP' as HealthState)
          : ('DOWN' as HealthState),
      backupId: latest.id,
      fileName: latest.fileName,
      createdAt: latest.createdAt,
      finishedAt: latest.finishedAt,
      error: latest.error,
    };
  }

  private async getLatestRestore() {
    const latest = await this.prisma.backupRestoreJob.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!latest) {
      return {
        key: 'latest-restore',
        title: 'Latest Restore',
        status: 'UP' as HealthState,
        message: 'No restore has been executed.',
      };
    }

    return {
      key: 'latest-restore',
      title: 'Latest Restore',
      status:
        latest.status === BackupRestoreStatus.SUCCESS
          ? ('UP' as HealthState)
          : latest.status === BackupRestoreStatus.FAILED
            ? ('DOWN' as HealthState)
            : ('DEGRADED' as HealthState),
      restoreId: latest.id,
      createdAt: latest.createdAt,
      finishedAt: latest.finishedAt,
      error: latest.error,
    };
  }

  private async getSystemStatusSummary() {
    const [activeCount, downCount, degradedCount] = await Promise.all([
      this.prisma.systemStatus.count({
        where: {
          isActive: true,
        },
      }),
      this.prisma.systemStatus.count({
        where: {
          isActive: true,
          lastHealthState: 'DOWN',
        },
      }),
      this.prisma.systemStatus.count({
        where: {
          isActive: true,
          lastHealthState: 'DEGRADED',
        },
      }),
    ]);

    return {
      key: 'external-systems',
      title: 'Managed Systems',
      status:
        downCount > 0
          ? ('DOWN' as HealthState)
          : degradedCount > 0
            ? ('DEGRADED' as HealthState)
            : ('UP' as HealthState),
      activeCount,
      downCount,
      degradedCount,
    };
  }

  private async checkDisk(path: string) {
    try {
      await mkdir(path, {
        recursive: true,
      });
      const { stdout } = await execFileAsync('df', ['-Pk', path]);
      const [, line] = stdout.trim().split('\n');
      const parts = line.trim().split(/\s+/);
      const totalKb = Number(parts[1]);
      const usedKb = Number(parts[2]);
      const availableKb = Number(parts[3]);
      const usedPercent = totalKb ? Math.round((usedKb / totalKb) * 100) : 0;

      return {
        key: 'disk',
        title: 'Backup Disk Space',
        status:
          usedPercent >= 95
            ? ('DOWN' as HealthState)
            : usedPercent >= 85
              ? ('DEGRADED' as HealthState)
              : ('UP' as HealthState),
        path,
        totalBytes: totalKb * 1024,
        availableBytes: availableKb * 1024,
        usedPercent,
      };
    } catch (error) {
      return {
        key: 'disk',
        title: 'Backup Disk Space',
        status: 'DEGRADED' as HealthState,
        path,
        error: this.getErrorMessage(error),
      };
    }
  }

  private async checkEnvironment() {
    const required = ['DATABASE_URL', 'JWT_SECRET'];
    const missing = required.filter((key) => !process.env[key]);
    const optionalWarnings = [
      !process.env.PORTAL_URL ? 'PORTAL_URL is not set.' : null,
      !process.env.BACKUP_DIR ? 'BACKUP_DIR is using default path.' : null,
    ].filter(Boolean);

    return {
      key: 'environment',
      title: 'Environment',
      status:
        missing.length > 0
          ? ('DOWN' as HealthState)
          : optionalWarnings.length > 0
            ? ('DEGRADED' as HealthState)
            : ('UP' as HealthState),
      missing,
      warnings: optionalWarnings,
    };
  }

  private reduceStatus(statuses: HealthState[]) {
    if (statuses.includes('DOWN')) return 'DOWN';
    if (statuses.includes('DEGRADED')) return 'DEGRADED';
    return 'UP';
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

  private getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
