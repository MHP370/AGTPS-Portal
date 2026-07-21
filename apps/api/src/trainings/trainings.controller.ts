import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { createReadStream } from 'node:fs';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateInPersonParticipantDto } from './dto/create-in-person-participant.dto';
import { CreateInPersonTrainingDto } from './dto/create-in-person-training.dto';
import { CreateTrainingCategoryDto } from './dto/create-training-category.dto';
import { CreateTrainingItemDto } from './dto/create-training-item.dto';
import { CreateTrainingSourceDto } from './dto/create-training-source.dto';
import { UpdateInPersonParticipantDto } from './dto/update-in-person-participant.dto';
import { UpdateInPersonTrainingDto } from './dto/update-in-person-training.dto';
import { UpdateTrainingCategoryDto } from './dto/update-training-category.dto';
import { UpdateTrainingItemDto } from './dto/update-training-item.dto';
import { UpdateTrainingSourceDto } from './dto/update-training-source.dto';
import { UpsertTrainingProgressDto } from './dto/upsert-training-progress.dto';
import { TrainingsService } from './trainings.service';

@Controller('trainings')
export class TrainingsController {
  constructor(private readonly trainingsService: TrainingsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findPublishedItems() {
    return this.trainingsService.findPublishedItems();
  }

  @Get('items/:id/content')
  @UseGuards(JwtAuthGuard)
  async content(
    @Param('id') id: string,
    @Query('path') filePath: string | undefined,
    @Query('download') download: string | undefined,
    @Req() request: {
      user: { permissions?: string[] };
      headers: { range?: string };
    },
    @Res({ passthrough: true }) response: Response,
  ) {
    const content = await this.trainingsService.prepareSmbContent(
      id,
      request.user,
      filePath,
    );
    const range = request.headers.range;
    response.setHeader('Accept-Ranges', 'bytes');
    response.setHeader('Content-Type', content.contentType);
    response.setHeader(
      'Content-Disposition',
      `${download === '1' ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(content.filename)}`,
    );

    if (range) {
      const match = range.match(/^bytes=(\d*)-(\d*)$/);
      if (match) {
        const start = match[1] ? Number(match[1]) : 0;
        const end = match[2]
          ? Math.min(Number(match[2]), content.size - 1)
          : content.size - 1;
        if (start <= end && start < content.size) {
          response.status(206);
          response.setHeader('Content-Range', `bytes ${start}-${end}/${content.size}`);
          response.setHeader('Content-Length', String(end - start + 1));
          return new StreamableFile(createReadStream(content.path, { start, end }));
        }
      }
      response.status(416);
      response.setHeader('Content-Range', `bytes */${content.size}`);
      return;
    }

    response.setHeader('Content-Length', String(content.size));
    return new StreamableFile(createReadStream(content.path));
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

  @Get('admin/in-person')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  findInPersonTrainings() {
    return this.trainingsService.findInPersonTrainings();
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
  updateItem(@Param('id') id: string, @Body() dto: UpdateTrainingItemDto) {
    return this.trainingsService.updateItem(id, dto);
  }

  @Delete('items/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.delete')
  removeItem(@Param('id') id: string) {
    return this.trainingsService.removeItem(id);
  }

  @Post('in-person')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  createInPersonTraining(@Body() dto: CreateInPersonTrainingDto) {
    return this.trainingsService.createInPersonTraining(dto);
  }

  @Put('in-person/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  updateInPersonTraining(
    @Param('id') id: string,
    @Body() dto: UpdateInPersonTrainingDto,
  ) {
    return this.trainingsService.updateInPersonTraining(id, dto);
  }

  @Delete('in-person/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  removeInPersonTraining(@Param('id') id: string) {
    return this.trainingsService.removeInPersonTraining(id);
  }

  @Post('in-person/:id/participants')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  createInPersonParticipant(
    @Param('id') id: string,
    @Body() dto: CreateInPersonParticipantDto,
  ) {
    return this.trainingsService.createInPersonParticipant(id, dto);
  }

  @Put('in-person/participants/:participantId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  updateInPersonParticipant(
    @Param('participantId') participantId: string,
    @Body() dto: UpdateInPersonParticipantDto,
  ) {
    return this.trainingsService.updateInPersonParticipant(participantId, dto);
  }

  @Delete('in-person/participants/:participantId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  removeInPersonParticipant(@Param('participantId') participantId: string) {
    return this.trainingsService.removeInPersonParticipant(participantId);
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
  updateSource(@Param('id') id: string, @Body() dto: UpdateTrainingSourceDto) {
    return this.trainingsService.updateSource(id, dto);
  }

  @Post('sources/:id/test')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.manage')
  testSource(@Param('id') id: string) {
    return this.trainingsService.testSource(id);
  }

  @Post('sources/:id/sync')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.manage')
  syncSource(
    @Param('id') id: string,
  ) {
    return this.trainingsService.syncSource(id, {
      username: process.env.KERBEROS_SYNC_USERNAME || 'svc-agtps-portal',
    });
  }

  @Post('sources/:id/upload')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.manage')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: '/tmp',
        filename: (_request, file, callback) =>
          callback(null, `agtps-training-upload-${randomUUID()}-${file.originalname.replace(/[^\p{L}\p{N}._-]+/gu, '_')}`),
      }),
      limits: { fileSize: 2 * 1024 * 1024 * 1024 },
    }),
  )
  uploadSourceFile(
    @Param('id') id: string,
    @Body('trainingSlug') trainingSlug: string,
    @UploadedFile()
    file: { originalname: string; path: string; size: number },
  ) {
    return this.trainingsService.uploadSourceFile(id, trainingSlug, file);
  }

  @Delete('sources/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.manage')
  removeSource(@Param('id') id: string) {
    return this.trainingsService.removeSource(id);
  }
}
