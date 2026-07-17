import {
  Body,
  Controller,
  Get,
  Param,
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
import { ChangeUserPasswordDto } from './dto/change-user-password.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get()
  @Permissions('users.manage')
  findAll() {
    return this.usersService.findAll();
  }

  @Put(':id/password')
  @Permissions('users.manage')
  changePassword(
    @Param('id') id: string,
    @Body() dto: ChangeUserPasswordDto,
    @Req() request: Request & { user?: { id: string; username?: string; email?: string } },
  ) {
    return this.usersService.changePassword(id, dto.password).then(async (result) => {
      await this.auditLogsService.record({
        actor: request.user,
        request: this.getRequestMeta(request),
        action: AuditAction.PASSWORD_CHANGED,
        entityType: 'user',
        entityId: id,
        summary: 'Admin changed user password',
      });

      return result;
    });
  }

  @Put(':id/profile')
  @Permissions('users.manage')
  updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateUserProfileDto,
    @Req() request: Request & { user?: { id: string; username?: string; email?: string } },
  ) {
    return this.usersService.updateProfile(id, dto).then(async (result) => {
      await this.auditLogsService.record({
        actor: request.user,
        request: this.getRequestMeta(request),
        action: AuditAction.USER_UPDATED,
        entityType: 'user',
        entityId: id,
        summary: 'Admin updated user profile',
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
