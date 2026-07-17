import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import type { Request } from 'express';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { CreateSmtpServerDto } from './dto/create-smtp-server.dto';
import { QueueEmailDto } from './dto/queue-email.dto';
import { PushSubscriptionDto } from './dto/push-subscription.dto';
import { TestSmtpDto } from './dto/test-smtp.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { UpdateNotificationRuleDto } from './dto/update-notification-rule.dto';
import { UpdateSmtpServerDto } from './dto/update-smtp-server.dto';
import { NotificationsService } from './notifications.service';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Req()
    request: Request & {
      user?: { id: string; username?: string; email?: string };
    },
  ) {
    return this.notificationsService.findAll(request.user);
  }

  @Get('push/config')
  getPushConfig() {
    return this.notificationsService.getPushConfig();
  }

  @Post('push/subscribe')
  @UseGuards(OptionalJwtAuthGuard)
  subscribe(
    @Body() dto: PushSubscriptionDto,
    @Req()
    request: Request & {
      user?: { id: string; username?: string; email?: string };
    },
  ) {
    return this.notificationsService.subscribe(dto, request.user);
  }

  @Post('push/unsubscribe')
  unsubscribe(@Body() dto: PushSubscriptionDto) {
    return this.notificationsService.unsubscribe(dto);
  }

  @Put('read-all')
  @UseGuards(OptionalJwtAuthGuard)
  markAllRead(
    @Req()
    request: Request & {
      user?: { id: string; username?: string; email?: string };
    },
  ) {
    return this.notificationsService.markAllRead(request.user);
  }

  @Put(':id/read')
  @UseGuards(OptionalJwtAuthGuard)
  markRead(
    @Param('id') id: string,
    @Req()
    request: Request & {
      user?: { id: string; username?: string; email?: string };
    },
  ) {
    return this.notificationsService.markRead(id, request.user);
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('notification.view')
  stats() {
    return this.notificationsService.getNotificationCenterStats();
  }

  @Get('admin/smtp')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('notification.smtp.manage')
  findSmtpServers() {
    return this.notificationsService.findSmtpServers();
  }

  @Post('admin/smtp')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('notification.smtp.manage')
  createSmtpServer(@Body() dto: CreateSmtpServerDto) {
    return this.notificationsService.createSmtpServer(dto);
  }

  @Put('admin/smtp/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('notification.smtp.manage')
  updateSmtpServer(
    @Param('id') id: string,
    @Body() dto: UpdateSmtpServerDto,
  ) {
    return this.notificationsService.updateSmtpServer(id, dto);
  }

  @Delete('admin/smtp/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('notification.smtp.manage')
  deleteSmtpServer(@Param('id') id: string) {
    return this.notificationsService.deleteSmtpServer(id);
  }

  @Post('admin/smtp/:id/test')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('notification.smtp.manage')
  testSmtpServer(
    @Param('id') id: string,
    @Body() dto: TestSmtpDto,
  ) {
    return this.notificationsService.testSmtpServer(id, dto);
  }

  @Get('admin/templates')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('notification.templates.manage')
  findTemplates() {
    return this.notificationsService.findTemplates();
  }

  @Post('admin/templates')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('notification.templates.manage')
  createTemplate(@Body() dto: CreateNotificationTemplateDto) {
    return this.notificationsService.createTemplate(dto);
  }

  @Put('admin/templates/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('notification.templates.manage')
  updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationTemplateDto,
  ) {
    return this.notificationsService.updateTemplate(id, dto);
  }

  @Delete('admin/templates/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('notification.templates.manage')
  deleteTemplate(@Param('id') id: string) {
    return this.notificationsService.deleteTemplate(id);
  }

  @Get('admin/rules')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('notification.manage')
  findRules() {
    return this.notificationsService.findRules();
  }

  @Put('admin/rules/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('notification.manage')
  updateRule(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationRuleDto,
    @Req() request: Request & {
      user?: { id: string; username?: string; email?: string };
    },
  ) {
    return this.notificationsService.updateRule(id, dto).then(async (rule) => {
      await this.auditLogsService.record({
        actor: request.user,
        request: this.getRequestMeta(request),
        action: AuditAction.NOTIFICATION_RULE_UPDATED,
        entityType: 'notification-rule',
        entityId: id,
        summary: `Notification rule updated: ${rule.eventKey}`,
        metadata: {
          eventKey: rule.eventKey,
          portalEnabled: rule.portalEnabled,
          emailEnabled: rule.emailEnabled,
          isActive: rule.isActive,
        },
      });

      return rule;
    });
  }

  @Get('admin/email-queue')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('notification.view')
  findEmailQueue() {
    return this.notificationsService.findEmailQueue();
  }

  @Post('admin/email-queue')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('notification.manage')
  queueEmail(@Body() dto: QueueEmailDto) {
    return this.notificationsService.queueEmail(dto);
  }

  @Post('admin/email-queue/process')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('notification.manage')
  processEmailQueue() {
    return this.notificationsService.processEmailQueue();
  }

  @Post('admin/email-queue/:id/send')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('notification.manage')
  sendQueuedEmail(@Param('id') id: string) {
    return this.notificationsService.sendQueuedEmail(id);
  }

  @Post('admin/email-queue/:id/cancel')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('notification.manage')
  cancelQueuedEmail(@Param('id') id: string) {
    return this.notificationsService.cancelQueuedEmail(id);
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
