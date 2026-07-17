import { Controller, Get, UseGuards } from '@nestjs/common';
import { Permissions } from './auth/decorators/permissions.decorator';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return this.appService.getLiveness();
  }

  @Get('health/readiness')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('system-statuses.manage')
  getReadiness() {
    return this.appService.getReadiness();
  }
}
