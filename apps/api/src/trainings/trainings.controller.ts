import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateTrainingCategoryDto } from './dto/create-training-category.dto';
import { CreateTrainingItemDto } from './dto/create-training-item.dto';
import { CreateTrainingSourceDto } from './dto/create-training-source.dto';
import { UpdateTrainingCategoryDto } from './dto/update-training-category.dto';
import { UpdateTrainingItemDto } from './dto/update-training-item.dto';
import { UpdateTrainingSourceDto } from './dto/update-training-source.dto';
import { UpsertTrainingProgressDto } from './dto/upsert-training-progress.dto';
import { TrainingsService } from './trainings.service';

@Controller('trainings')
export class TrainingsController {
  constructor(private readonly trainingsService: TrainingsService) {}

  @Get()
  findPublishedItems() {
    return this.trainingsService.findPublishedItems();
  }

  @Get('categories')
  findCategories() {
    return this.trainingsService.findCategories();
  }

  @Get(':id/progress')
  findProgress(
    @Param('id') id: string,
    @Query('visitorKey') visitorKey: string,
  ) {
    return this.trainingsService.findProgress(id, visitorKey);
  }

  @Put(':id/progress')
  upsertProgress(
    @Param('id') id: string,
    @Body() dto: UpsertTrainingProgressDto,
  ) {
    return this.trainingsService.upsertProgress(id, dto);
  }

  @Get('admin/items')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.manage')
  findAllItems() {
    return this.trainingsService.findAllItems();
  }

  @Get('admin/categories')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.manage')
  findAllCategories() {
    return this.trainingsService.findCategories(true);
  }

  @Get('admin/sources')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.manage')
  findSources() {
    return this.trainingsService.findSources();
  }

  @Post('items')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.manage')
  createItem(@Body() dto: CreateTrainingItemDto) {
    return this.trainingsService.createItem(dto);
  }

  @Put('items/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.manage')
  updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateTrainingItemDto,
  ) {
    return this.trainingsService.updateItem(id, dto);
  }

  @Delete('items/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.delete')
  removeItem(@Param('id') id: string) {
    return this.trainingsService.removeItem(id);
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.manage')
  createCategory(@Body() dto: CreateTrainingCategoryDto) {
    return this.trainingsService.createCategory(dto);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.manage')
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateTrainingCategoryDto,
  ) {
    return this.trainingsService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.manage')
  removeCategory(@Param('id') id: string) {
    return this.trainingsService.removeCategory(id);
  }

  @Post('sources')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.manage')
  createSource(@Body() dto: CreateTrainingSourceDto) {
    return this.trainingsService.createSource(dto);
  }

  @Put('sources/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.manage')
  updateSource(
    @Param('id') id: string,
    @Body() dto: UpdateTrainingSourceDto,
  ) {
    return this.trainingsService.updateSource(id, dto);
  }

  @Delete('sources/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.manage')
  removeSource(@Param('id') id: string) {
    return this.trainingsService.removeSource(id);
  }
}
