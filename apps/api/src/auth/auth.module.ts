import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ActiveDirectoryAuthService } from './active-directory-auth.service';

import { UsersModule } from '../users/users.module';

import { PassportModule } from '@nestjs/passport';

import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';


import { Reflector } from '@nestjs/core';
import { RolesGuard } from './guards/roles.guard';

import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    PrismaModule,
    AuditLogsModule,

    JwtModule.register({
      secret: process.env.JWT_SECRET || 'AGTPS_SECRET_KEY_CHANGE_ME',
      signOptions: {
        expiresIn: '8h',
      },
    }),
  ],

  controllers: [AuthController],

  providers: [
  AuthService,
  ActiveDirectoryAuthService,
  JwtStrategy,
  JwtAuthGuard,
  OptionalJwtAuthGuard,
  RolesGuard,
  Reflector,
  PermissionsGuard,
],

  exports: [AuthService],
})
export class AuthModule {}
