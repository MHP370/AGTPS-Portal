import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Put,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import type { Request, Response } from 'express';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateBackupDto } from './dto/create-backup.dto';
import { RestoreBackupDto } from './dto/restore-backup.dto';
import { UpdateBackupSettingsDto } from './dto/update-backup-settings.dto';
import { BackupsService } from './backups.service';

@Controller('backups')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BackupsController {
  constructor(
    private readonly backupsService: BackupsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get()
  @Permissions('backup.view')
  findAll() {
    return this.backupsService.findAll();
  }

  @Get('settings')
  @Permissions('backup.view')
  getSettings() {
    return this.backupsService.getSettings();
  }

  @Get('restore-jobs')
  @Permissions('backup.view')
  findRestoreJobs() {
    return this.backupsService.findRestoreJobs();
  }

  @Put('settings')
  @Permissions('backup.manage')
  updateSettings(@Body() dto: UpdateBackupSettingsDto) {
    return this.backupsService.updateSettings(dto);
  }

  @Post()
  @Permissions('backup.manage')
  async create(
    @Body() dto: CreateBackupDto,
    @Req() request: Request & { user?: { id: string; username?: string; email?: string } },
  ) {
    const backup = await this.backupsService.createManualBackup(dto);
    await this.auditLogsService.record({
      actor: request.user,
      request: this.getRequestMeta(request),
      action: AuditAction.BACKUP_CREATED,
      entityType: 'backup',
      entityId: backup.id,
      summary: `Backup ${backup.status}`,
      metadata: {
        status: backup.status,
        type: backup.type,
        includeDatabase: backup.includeDatabase,
        includeUploads: backup.includeUploads,
      },
    });

    return backup;
  }

  @Post(':id/restore')
  @Permissions('backup.manage')
  restore(
    @Param('id') id: string,
    @Body() dto: RestoreBackupDto,
    @Req() request: Request & { user?: { id: string; username?: string; email?: string } },
  ) {
    return this.backupsService.restore(id, dto).then(async (result) => {
      await this.auditLogsService.record({
        actor: request.user,
        request: this.getRequestMeta(request),
        action: AuditAction.BACKUP_RESTORED,
        entityType: 'backup-restore',
        entityId: result.id,
        summary: `Restore ${result.status}`,
        metadata: {
          sourceBackupId: id,
          status: result.status,
          restoreDatabase: result.restoreDatabase,
          restoreUploads: result.restoreUploads,
        },
      });

      return result;
    });
  }

  @Get(':id/download')
  @Permissions('backup.view')
  @Header('Cache-Control', 'no-store')
  async download(
    @Param('id') id: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const result = await this.backupsService.streamBackup(id);

    response.setHeader('Content-Type', 'application/gzip');
    response.setHeader('Content-Length', String(result.contentLength));
    response.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(result.filename)}`,
    );

    return result.file;
  }

  @Delete(':id')
  @Permissions('backup.manage')
  remove(
    @Param('id') id: string,
    @Req() request: Request & { user?: { id: string; username?: string; email?: string } },
  ) {
    return this.backupsService.remove(id).then(async (result) => {
      await this.auditLogsService.record({
        actor: request.user,
        request: this.getRequestMeta(request),
        action: AuditAction.BACKUP_DELETED,
        entityType: 'backup',
        entityId: id,
        summary: 'Backup deleted',
      });

      return result;
    });
  }

  private getRequestMeta(request: Request) {
    return {
      ipAddress: request.ip,
      userAgent: Array.isArray(request.headers['user-agent'])
        ? request.headers['user-agent'].join(', ')
        : request.headers['user-agent'],
    };
  }
}
