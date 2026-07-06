import {
  Body,
  Controller,
  Get,
  Put,
  Post,
  UseGuards,
} from '@nestjs/common';

import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
  ) {}

  @Get()
  find() {
    return this.settingsService.find();
  }

  @Put()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings.manage')
  update(
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.settingsService.update(dto);
  }

  @Post('active-directory/test')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings.manage')
  testActiveDirectoryConnection() {
    return this.settingsService.testActiveDirectoryConnection();
  }
}
