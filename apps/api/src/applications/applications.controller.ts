import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import { ApplicationsService } from './applications.service';

import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

import { CreateApplicationSiteDto } from './dto/create-application-site.dto';
import { UpdateApplicationSiteDto } from './dto/update-application-site.dto';

import { UseGuards } from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('applications.manage')
@Controller('applications')
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
  ) {}

  // =========================
  // Applications
  // =========================

  @Get()
  findAll() {
    return this.applicationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.applicationsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.applicationsService.remove(id);
  }

  // =========================
  // Application Sites
  // =========================

  @Post('sites')
  createSite(@Body() dto: CreateApplicationSiteDto) {
    return this.applicationsService.createSite(dto);
  }

  @Put('sites/:id')
  updateSite(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationSiteDto,
  ) {
    return this.applicationsService.updateSite(id, dto);
  }

  @Delete('sites/:id')
  removeSite(@Param('id') id: string) {
    return this.applicationsService.removeSite(id);
  }
}
