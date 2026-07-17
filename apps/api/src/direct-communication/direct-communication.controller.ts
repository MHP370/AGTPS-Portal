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
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateDirectConversationDto } from './dto/create-direct-conversation.dto';
import { CreateDirectManagerDto } from './dto/create-direct-manager.dto';
import { CreateDirectReplyDto } from './dto/create-direct-reply.dto';
import { CreateDirectUserConversationDto } from './dto/create-direct-user-conversation.dto';
import { CreateForbiddenWordDto } from './dto/create-forbidden-word.dto';
import { UpdateDirectConversationStatusDto } from './dto/update-direct-conversation-status.dto';
import { UpdateDirectManagerDto } from './dto/update-direct-manager.dto';
import { UpdateForbiddenWordDto } from './dto/update-forbidden-word.dto';
import { DirectCommunicationService } from './direct-communication.service';

@Controller('direct-communication')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DirectCommunicationController {
  constructor(
    private readonly directCommunicationService: DirectCommunicationService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get('messaging/config')
  getMessagingConfig() {
    return this.directCommunicationService.getMessagingConfig();
  }

  @Get('available-managers')
  findAvailableManagers() {
    return this.directCommunicationService.findAvailableManagers();
  }

  @Get('my/conversations')
  findMyConversations(
    @Req() request: Request & { user?: { id: string; username?: string; email?: string } },
  ) {
    return this.directCommunicationService.findMyConversations(request.user);
  }

  @Get('my/conversations/:id')
  findMyConversationDetail(
    @Param('id') id: string,
    @Req() request: Request & { user?: { id: string; username?: string; email?: string } },
  ) {
    return this.directCommunicationService.findMyConversationDetail(
      id,
      request.user,
    );
  }

  @Get('my/inbox')
  findMyInbox(
    @Req() request: Request & { user?: { id: string; username?: string; email?: string } },
  ) {
    return this.directCommunicationService.findInboxConversations(request.user);
  }

  @Post('my/conversations')
  async createMyConversation(
    @Body() dto: CreateDirectUserConversationDto,
    @Req() request: Request & { user?: { id: string; username?: string; email?: string } },
  ) {
    const conversation =
      await this.directCommunicationService.createUserConversation(
        dto,
        request.user,
      );
    await this.auditLogsService.record({
      actor: request.user,
      request: this.getRequestMeta(request),
      action: AuditAction.DIRECT_CONVERSATION_CREATED,
      entityType: 'direct-communication-conversation',
      entityId: conversation.id,
      summary: `Direct communication conversation created by user: ${conversation.subject}`,
      metadata: {
        mode: conversation.mode,
        category: conversation.category,
        priority: conversation.priority,
        managerId: conversation.manager.id,
      },
    });

    return conversation;
  }

  @Post('my/conversations/:id/replies')
  async createMyConversationReply(
    @Param('id') id: string,
    @Body() dto: CreateDirectReplyDto,
    @Req() request: Request & { user?: { id: string; username?: string; email?: string } },
  ) {
    const conversation =
      await this.directCommunicationService.createConversationReply(
        id,
        dto,
        request.user,
      );
    await this.auditLogsService.record({
      actor: request.user,
      request: this.getRequestMeta(request),
      action: AuditAction.DIRECT_CONVERSATION_REPLIED,
      entityType: 'direct-communication-conversation',
      entityId: id,
      summary: 'Direct communication conversation replied',
      metadata: {
        status: conversation.status,
        managerId: conversation.manager.id,
      },
    });

    return conversation;
  }

  @Put('my/inbox/:id/status')
  async updateMyInboxConversationStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDirectConversationStatusDto,
    @Req() request: Request & { user?: { id: string; username?: string; email?: string } },
  ) {
    const conversation =
      await this.directCommunicationService.updateOwnInboxConversationStatus(
        id,
        dto,
        request.user,
      );
    await this.auditLogsService.record({
      actor: request.user,
      request: this.getRequestMeta(request),
      action: AuditAction.DIRECT_CONVERSATION_STATUS_CHANGED,
      entityType: 'direct-communication-conversation',
      entityId: id,
      summary: `Direct communication own inbox status changed: ${conversation.status}`,
      metadata: {
        status: conversation.status,
      },
    });

    return conversation;
  }

  @Get('conversations')
  @Permissions('ceo.messages.view')
  findConversations() {
    return this.directCommunicationService.findConversations();
  }

  @Post('conversations')
  @Permissions('ceo.messages.manage')
  async createConversation(
    @Body() dto: CreateDirectConversationDto,
    @Req() request: Request & { user?: { id: string; username?: string; email?: string } },
  ) {
    const conversation =
      await this.directCommunicationService.createConversation(
        dto,
        request.user,
      );
    await this.auditLogsService.record({
      actor: request.user,
      request: this.getRequestMeta(request),
      action: AuditAction.DIRECT_CONVERSATION_CREATED,
      entityType: 'direct-communication-conversation',
      entityId: conversation.id,
      summary: `Direct communication conversation created: ${conversation.subject}`,
      metadata: {
        mode: conversation.mode,
        category: conversation.category,
        priority: conversation.priority,
        managerId: conversation.manager.id,
      },
    });

    return conversation;
  }

  @Put('conversations/:id/status')
  @Permissions('ceo.messages.manage')
  async updateConversationStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDirectConversationStatusDto,
    @Req() request: Request & { user?: { id: string; username?: string; email?: string } },
  ) {
    const conversation =
      await this.directCommunicationService.updateConversationStatus(id, dto);
    await this.auditLogsService.record({
      actor: request.user,
      request: this.getRequestMeta(request),
      action: AuditAction.DIRECT_CONVERSATION_STATUS_CHANGED,
      entityType: 'direct-communication-conversation',
      entityId: id,
      summary: `Direct communication conversation status changed: ${conversation.status}`,
      metadata: {
        status: conversation.status,
      },
    });

    return conversation;
  }

  @Get('managers')
  @Permissions('ceo.settings.manage')
  findManagers() {
    return this.directCommunicationService.findManagers();
  }

  @Post('managers')
  @Permissions('ceo.settings.manage')
  async createManager(
    @Body() dto: CreateDirectManagerDto,
    @Req() request: Request & { user?: { id: string; username?: string; email?: string } },
  ) {
    const manager = await this.directCommunicationService.createManager(dto);
    await this.auditLogsService.record({
      actor: request.user,
      request: this.getRequestMeta(request),
      action: AuditAction.DIRECT_MANAGER_CREATED,
      entityType: 'direct-communication-manager',
      entityId: manager.id,
      summary: `Direct manager created: ${manager.title}`,
      metadata: {
        isCeo: manager.isCeo,
        department: manager.department,
      },
    });

    return manager;
  }

  @Put('managers/:id')
  @Permissions('ceo.settings.manage')
  async updateManager(
    @Param('id') id: string,
    @Body() dto: UpdateDirectManagerDto,
    @Req() request: Request & { user?: { id: string; username?: string; email?: string } },
  ) {
    const manager = await this.directCommunicationService.updateManager(id, dto);
    await this.auditLogsService.record({
      actor: request.user,
      request: this.getRequestMeta(request),
      action: AuditAction.DIRECT_MANAGER_UPDATED,
      entityType: 'direct-communication-manager',
      entityId: id,
      summary: `Direct manager updated: ${manager.title}`,
      metadata: {
        isCeo: manager.isCeo,
        department: manager.department,
        isActive: manager.isActive,
      },
    });

    return manager;
  }

  @Delete('managers/:id')
  @Permissions('ceo.settings.manage')
  async removeManager(
    @Param('id') id: string,
    @Req() request: Request & { user?: { id: string; username?: string; email?: string } },
  ) {
    const manager = await this.directCommunicationService.removeManager(id);
    await this.auditLogsService.record({
      actor: request.user,
      request: this.getRequestMeta(request),
      action: AuditAction.DIRECT_MANAGER_DELETED,
      entityType: 'direct-communication-manager',
      entityId: id,
      summary: `Direct manager deleted: ${manager.title}`,
    });

    return manager;
  }

  @Get('forbidden-words')
  @Permissions('ceo.settings.manage')
  findForbiddenWords() {
    return this.directCommunicationService.findForbiddenWords();
  }

  @Post('forbidden-words')
  @Permissions('ceo.settings.manage')
  async createForbiddenWord(
    @Body() dto: CreateForbiddenWordDto,
    @Req() request: Request & { user?: { id: string; username?: string; email?: string } },
  ) {
    const word = await this.directCommunicationService.createForbiddenWord(dto);
    await this.auditLogsService.record({
      actor: request.user,
      request: this.getRequestMeta(request),
      action: AuditAction.FORBIDDEN_WORD_CREATED,
      entityType: 'direct-communication-forbidden-word',
      entityId: word.id,
      summary: 'Forbidden word created',
    });

    return word;
  }

  @Put('forbidden-words/:id')
  @Permissions('ceo.settings.manage')
  async updateForbiddenWord(
    @Param('id') id: string,
    @Body() dto: UpdateForbiddenWordDto,
    @Req() request: Request & { user?: { id: string; username?: string; email?: string } },
  ) {
    const word = await this.directCommunicationService.updateForbiddenWord(id, dto);
    await this.auditLogsService.record({
      actor: request.user,
      request: this.getRequestMeta(request),
      action: AuditAction.FORBIDDEN_WORD_UPDATED,
      entityType: 'direct-communication-forbidden-word',
      entityId: id,
      summary: 'Forbidden word updated',
      metadata: {
        isActive: word.isActive,
      },
    });

    return word;
  }

  @Delete('forbidden-words/:id')
  @Permissions('ceo.settings.manage')
  async removeForbiddenWord(
    @Param('id') id: string,
    @Req() request: Request & { user?: { id: string; username?: string; email?: string } },
  ) {
    const word = await this.directCommunicationService.removeForbiddenWord(id);
    await this.auditLogsService.record({
      actor: request.user,
      request: this.getRequestMeta(request),
      action: AuditAction.FORBIDDEN_WORD_DELETED,
      entityType: 'direct-communication-forbidden-word',
      entityId: id,
      summary: 'Forbidden word deleted',
    });

    return word;
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
