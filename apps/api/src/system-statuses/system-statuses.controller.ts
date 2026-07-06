import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateSystemStatusDto } from './dto/create-system-status.dto';
import { UpdateSystemStatusDto } from './dto/update-system-status.dto';
import { SystemStatusesService } from './system-statuses.service';

@Controller('system-statuses')
export class SystemStatusesController {
  constructor(
    private readonly systemStatusesService: SystemStatusesService,
  ) {}

  @Get()
  findAll() {
    return this.systemStatusesService.findAll();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('system-statuses.manage')
  findAllForAdmin() {
    return this.systemStatusesService.findAll(true);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.systemStatusesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('system-statuses.manage')
  create(@Body() dto: CreateSystemStatusDto) {
    return this.systemStatusesService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('system-statuses.manage')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSystemStatusDto,
  ) {
    return this.systemStatusesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('system-statuses.manage')
  remove(@Param('id') id: string) {
    return this.systemStatusesService.remove(id);
  }
}
