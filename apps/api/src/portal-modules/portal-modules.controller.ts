import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { UpdatePortalModuleDto } from './dto/update-portal-module.dto';
import { PortalModulesService } from './portal-modules.service';

@Controller('portal-modules')
export class PortalModulesController {
  constructor(private readonly portalModulesService: PortalModulesService) {}

  @Get()
  findEnabled() {
    return this.portalModulesService.findEnabled();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('modules.manage')
  findAllForAdmin() {
    return this.portalModulesService.findAll(true);
  }

  @Put(':key')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('modules.manage')
  update(
    @Param('key') key: string,
    @Body() dto: UpdatePortalModuleDto,
  ) {
    return this.portalModulesService.update(key, dto);
  }
}
