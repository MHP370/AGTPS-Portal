import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Put,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';

import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthService } from './auth.service';
import { ChangeOwnPasswordDto } from './dto/change-own-password.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get('login-options')
  loginOptions() {
    return this.authService.getLoginOptions();
  }

  @Get('windows/identity')
  windowsIdentity(
    @Headers('x-agtps-sso-secret') suppliedSecret: string | undefined,
    @Headers('x-authenticated-user') identity: string | undefined,
  ) {
    this.assertTrustedSsoRequest(suppliedSecret, identity);
    return this.authService.getWindowsIdentity(identity!);
  }

  @Post('windows/login')
  async windowsLogin(
    @Headers('x-agtps-sso-secret') suppliedSecret: string | undefined,
    @Headers('x-authenticated-user') identity: string | undefined,
    @Req() request: Request,
  ) {
    this.assertTrustedSsoRequest(suppliedSecret, identity);
    const result = await this.authService.loginWithWindowsIdentity(identity!);
    await this.auditLogsService.record({
      actor: result.user,
      request: this.getRequestMeta(request),
      action: AuditAction.LOGIN_SUCCESS,
      entityType: 'auth',
      entityId: result.user.id,
      summary: `Windows SSO login success for ${result.user.username}`,
    });
    return result;
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
  ) {
    try {
      const result = await this.authService.login(dto.username, dto.password, dto.authSource);

      await this.auditLogsService.record({
        actor: result.user,
        request: this.getRequestMeta(request),
        action: AuditAction.LOGIN_SUCCESS,
        entityType: 'auth',
        entityId: result.user.id,
        summary: `Login success for ${result.user.username}`,
      });

      return result;
    } catch (error) {
      await this.auditLogsService.record({
        actor: {
          username: dto.username,
        },
        request: this.getRequestMeta(request),
        action: AuditAction.LOGIN_FAILED,
        entityType: 'auth',
        summary: `Login failed for ${dto.username}`,
      });

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw error;
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: Request & { user?: { id: string } }) {
    return this.authService.getProfile(request.user!.id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @Req() request: Request & { user?: { id: string } },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(request.user!.id, dto);
  }

  @Put('password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Req() request: Request & { user?: { id: string } },
    @Body() dto: ChangeOwnPasswordDto,
  ) {
    return this.authService.changeOwnPassword(request.user!.id, dto);
  }

  private getRequestMeta(request: Request) {
    return {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    };
  }

  private assertTrustedSsoRequest(
    suppliedSecret: string | undefined,
    identity: string | undefined,
  ) {
    const expectedSecret = process.env.SSO_SHARED_SECRET;
    const trusted = Boolean(
      expectedSecret &&
      suppliedSecret &&
      expectedSecret.length === suppliedSecret.length &&
      timingSafeEqual(Buffer.from(expectedSecret), Buffer.from(suppliedSecret)),
    );
    if (!trusted || !identity) {
      throw new UnauthorizedException('Trusted Windows identity was not provided.');
    }
  }
}
