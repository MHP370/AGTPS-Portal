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
  UseGuards,
} from '@nestjs/common';
import { PollSurveyType } from '@prisma/client';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreatePollSurveyDto } from './dto/create-poll-survey.dto';
import { SubmitPollSurveyResponseDto } from './dto/submit-poll-survey-response.dto';
import { UpdatePollSurveyDto } from './dto/update-poll-survey.dto';
import { PollSurveysService } from './poll-surveys.service';

@Controller('poll-surveys')
export class PollSurveysController {
  constructor(private readonly pollSurveysService: PollSurveysService) {}

  @Get()
  findPublic(@Query('type') type?: PollSurveyType) {
    return this.pollSurveysService.findPublic(type);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('poll.manage', 'survey.manage')
  findAllForAdmin(@Query('type') type?: PollSurveyType) {
    return this.pollSurveysService.findAllForAdmin(type);
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('poll.manage', 'survey.manage')
  findOneForAdmin(@Param('id') id: string) {
    return this.pollSurveysService.findOneForAdmin(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pollSurveysService.findOne(id);
  }

  @Get(':id/results')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('reports.view')
  getResults(@Param('id') id: string) {
    return this.pollSurveysService.getResults(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('poll.manage', 'survey.manage')
  create(@Body() dto: CreatePollSurveyDto, @Req() req: any) {
    return this.pollSurveysService.create(dto, req.user?.id);
  }

  @Post(':id/clone')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('poll.manage', 'survey.manage')
  clone(@Param('id') id: string, @Req() req: any) {
    return this.pollSurveysService.clone(id, req.user?.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('poll.manage', 'survey.manage')
  update(@Param('id') id: string, @Body() dto: UpdatePollSurveyDto) {
    return this.pollSurveysService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('poll.manage', 'survey.manage')
  remove(@Param('id') id: string) {
    return this.pollSurveysService.remove(id);
  }

  @Post(':id/responses')
  submitResponse(
    @Param('id') id: string,
    @Body() dto: SubmitPollSurveyResponseDto,
  ) {
    return this.pollSurveysService.submitResponse(id, dto);
  }
}
