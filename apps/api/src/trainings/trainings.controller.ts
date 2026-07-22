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
import { EnrollDirectoryUsersDto } from './dto/enroll-directory-users.dto';
import {
  IssueTrainingCertificateDto,
  SubmitTrainingExamDto,
  UpsertCertificateTemplateDto,
  UpsertTrainingExamDto,
} from './dto/upsert-training-exam.dto';
import {
  GenerateCertificatesDto,
  UnlockTrainingDto,
  UpsertTrainingSignatoryDto,
} from './dto/training-management.dto';
import { TrainingsService } from './trainings.service';

@Controller('trainings')
export class TrainingsController {
  constructor(private readonly trainingsService: TrainingsService) {}

  @Get("certificates/verify/:certificateNumber")
  verifyCertificate(@Param("certificateNumber") certificateNumber: string) {
    return this.trainingsService.verifyCertificate(certificateNumber);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findPublishedItems() {
    return this.trainingsService.findPublishedItems();
  }

  @Get('my/courses')
  @UseGuards(JwtAuthGuard)
  findMyCourses(
    @Req() request: { user: { id?: string; directoryUserId?: string } },
  ) {
    return this.trainingsService.findMyCourses(request.user);
  }

  @Get('my/courses/:trainingId/exam')
  @UseGuards(JwtAuthGuard)
  findMyTrainingExam(
    @Param('trainingId') trainingId: string,
    @Req() request: { user: { id?: string; directoryUserId?: string } },
  ) {
    return this.trainingsService.findMyTrainingExam(trainingId, request.user);
  }

  @Post('my/courses/:trainingId/exam/start')
  @UseGuards(JwtAuthGuard)
  startTrainingExam(
    @Param('trainingId') trainingId: string,
    @Req() request: { user: { id?: string; directoryUserId?: string } },
  ) {
    return this.trainingsService.startTrainingExam(trainingId, request.user);
  }

  @Post('my/exam-attempts/:attemptId/submit')
  @UseGuards(JwtAuthGuard)
  submitTrainingExam(
    @Param('attemptId') attemptId: string,
    @Req() request: { user: { id?: string; directoryUserId?: string } },
    @Body() dto: SubmitTrainingExamDto,
  ) {
    return this.trainingsService.submitTrainingExam(attemptId, request.user, dto);
  }

  @Get('my/certificates/:id')
  @UseGuards(JwtAuthGuard)
  findMyCertificate(
    @Param('id') id: string,
    @Req() request: { user: { id?: string; directoryUserId?: string } },
  ) {
    return this.trainingsService.findMyCertificate(id, request.user);
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

  @Get('items/:id/preview')
  @UseGuards(JwtAuthGuard)
  async preview(
    @Param('id') id: string,
    @Query('path') filePath: string | undefined,
    @Req() request: { user: { permissions?: string[] } },
    @Res({ passthrough: true }) response: Response,
  ) {
    const content = await this.trainingsService.prepareSmbPreview(
      id,
      request.user,
      filePath,
    );
    response.setHeader('Content-Type', content.contentType);
    response.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodeURIComponent(content.filename)}`,
    );
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

  @Get('admin/items/:id/tree')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.manage')
  findItemTree(@Param('id') id: string) {
    return this.trainingsService.findItemTree(id);
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

  @Get('admin/in-person/:id/detail')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  findInPersonTrainingDetail(@Param('id') id: string) {
    return this.trainingsService.findInPersonTrainingDetail(id);
  }

  @Get('admin/course-reports')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  findCourseReports() {
    return this.trainingsService.findCourseReports();
  }

  @Get('admin/training-users')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  findTrainingUsers(@Query('search') search?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.trainingsService.findTrainingUsers(search, Number(page) || 1, Number(pageSize) || 15);
  }

  @Get('admin/eligible-participants')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  findEligibleParticipants(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.trainingsService.findEligibleParticipants(
      search,
      Number(page) || 1,
      Number(pageSize) || 12,
    );
  }

  @Get('admin/in-person/:trainingId/exam')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  findAdminTrainingExam(@Param('trainingId') trainingId: string) {
    return this.trainingsService.findAdminTrainingExam(trainingId);
  }

  @Put('admin/in-person/:trainingId/exam')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  upsertTrainingExam(
    @Param('trainingId') trainingId: string,
    @Body() dto: UpsertTrainingExamDto,
    @Req() request: { user: { id?: string; permissions?: string[] } },
  ) {
    return this.trainingsService.upsertTrainingExam(trainingId, dto, request.user);
  }

  @Get('admin/exams')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  findAdminExams() {
    return this.trainingsService.findAdminExams();
  }

  @Get('admin/certificate-templates')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  findCertificateTemplates() {
    return this.trainingsService.findCertificateTemplates(true);
  }

  @Post('admin/certificate-templates')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  createCertificateTemplate(@Body() dto: UpsertCertificateTemplateDto) {
    return this.trainingsService.createCertificateTemplate(dto);
  }

  @Put('admin/certificate-templates/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  updateCertificateTemplate(
    @Param('id') id: string,
    @Body() dto: UpsertCertificateTemplateDto,
  ) {
    return this.trainingsService.updateCertificateTemplate(id, dto);
  }

  @Delete('admin/certificate-templates/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  removeCertificateTemplate(@Param('id') id: string) {
    return this.trainingsService.removeCertificateTemplate(id);
  }

  @Get('admin/certificate-signatories')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  findCertificateSignatories() {
    return this.trainingsService.findCertificateSignatories();
  }

  @Post('admin/certificate-signatories')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  createCertificateSignatory(@Body() dto: UpsertTrainingSignatoryDto) {
    return this.trainingsService.createCertificateSignatory(dto);
  }

  @Put('admin/certificate-signatories/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  updateCertificateSignatory(@Param('id') id: string, @Body() dto: UpsertTrainingSignatoryDto) {
    return this.trainingsService.updateCertificateSignatory(id, dto);
  }

  @Delete('admin/certificate-signatories/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  removeCertificateSignatory(@Param('id') id: string) {
    return this.trainingsService.removeCertificateSignatory(id);
  }

  @Post('admin/in-person/:id/certificates/generate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  generateCourseCertificates(@Param('id') id: string, @Body() dto: GenerateCertificatesDto) {
    return this.trainingsService.generateCourseCertificates(id, dto.participantIds);
  }

  @Post('admin/certificates')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  issueCertificate(@Body() dto: IssueTrainingCertificateDto) {
    return this.trainingsService.issueCertificate(dto);
  }

  @Delete('admin/certificates/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  removeCertificate(@Param('id') id: string) {
    return this.trainingsService.removeCertificate(id);
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
  createInPersonTraining(
    @Body() dto: CreateInPersonTrainingDto,
    @Req() request: { user: { id?: string; permissions?: string[] } },
  ) {
    return this.trainingsService.createInPersonTraining(dto, request.user);
  }

  @Put('in-person/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  updateInPersonTraining(
    @Param('id') id: string,
    @Body() dto: UpdateInPersonTrainingDto,
    @Req() request: { user: { id?: string; permissions?: string[] } },
  ) {
    return this.trainingsService.updateInPersonTraining(id, dto, request.user);
  }

  @Post('in-person/:id/unlock')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.override')
  unlockInPersonTraining(
    @Param('id') id: string,
    @Body() dto: UnlockTrainingDto,
    @Req() request: { user: { id?: string } },
  ) {
    return this.trainingsService.unlockInPersonTraining(id, dto.reason, request.user);
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
    @Req() request: { user: { id?: string; permissions?: string[] } },
  ) {
    return this.trainingsService.createInPersonParticipant(id, dto, request.user);
  }

  @Post('in-person/:id/participants/batch')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  enrollDirectoryUsers(
    @Param('id') id: string,
    @Body() dto: EnrollDirectoryUsersDto,
    @Req() request: { user: { id?: string; permissions?: string[] } },
  ) {
    return this.trainingsService.enrollDirectoryUsers(
      id,
      dto.directoryUserIds,
      request.user,
    );
  }

  @Put('in-person/participants/:participantId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  updateInPersonParticipant(
    @Param('participantId') participantId: string,
    @Body() dto: UpdateInPersonParticipantDto,
    @Req() request: { user: { id?: string; permissions?: string[] } },
  ) {
    return this.trainingsService.updateInPersonParticipant(participantId, dto, request.user);
  }

  @Delete('in-person/participants/:participantId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('training.course.manage')
  removeInPersonParticipant(
    @Param('participantId') participantId: string,
    @Req() request: { user: { id?: string; permissions?: string[] } },
  ) {
    return this.trainingsService.removeInPersonParticipant(participantId, request.user);
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
