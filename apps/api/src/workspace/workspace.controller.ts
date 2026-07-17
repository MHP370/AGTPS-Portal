import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CreateNoteDto } from './dto/create-note.dto';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { WorkspaceService } from './workspace.service';

type AuthenticatedRequest = Request & {
  user?: { id: string; username?: string; email?: string };
};

@Controller('workspace')
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceService,
  ) {}

  @Get('notes')
  @UseGuards(OptionalJwtAuthGuard)
  findNotes(@Req() request: AuthenticatedRequest) {
    return this.workspaceService.findNotes(request.user?.id);
  }

  @Post('notes')
  @UseGuards(JwtAuthGuard)
  createNote(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateNoteDto,
  ) {
    return this.workspaceService.createNote(request.user!.id, dto);
  }

  @Put('notes/:id')
  @UseGuards(JwtAuthGuard)
  updateNote(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.workspaceService.updateNote(request.user!.id, id, dto);
  }

  @Delete('notes/:id')
  @UseGuards(JwtAuthGuard)
  removeNote(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.workspaceService.removeNote(request.user!.id, id);
  }

  @Get('reminders')
  @UseGuards(OptionalJwtAuthGuard)
  findReminders(@Req() request: AuthenticatedRequest) {
    return this.workspaceService.findReminders(request.user?.id);
  }

  @Post('reminders')
  @UseGuards(JwtAuthGuard)
  createReminder(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateReminderDto,
  ) {
    return this.workspaceService.createReminder(request.user!, dto);
  }

  @Put('reminders/:id')
  @UseGuards(JwtAuthGuard)
  updateReminder(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateReminderDto,
  ) {
    return this.workspaceService.updateReminder(
      request.user!.id,
      id,
      dto,
    );
  }

  @Delete('reminders/:id')
  @UseGuards(JwtAuthGuard)
  removeReminder(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.workspaceService.removeReminder(request.user!.id, id);
  }

  @Get('tasks')
  @UseGuards(OptionalJwtAuthGuard)
  findTasks(@Req() request: AuthenticatedRequest) {
    return this.workspaceService.findTasks(request.user?.id);
  }

  @Post('tasks')
  @UseGuards(JwtAuthGuard)
  createTask(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateTaskDto,
  ) {
    return this.workspaceService.createTask(request.user!, dto);
  }

  @Put('tasks/:id')
  @UseGuards(JwtAuthGuard)
  updateTask(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.workspaceService.updateTask(request.user!.id, id, dto);
  }

  @Delete('tasks/:id')
  @UseGuards(JwtAuthGuard)
  removeTask(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.workspaceService.removeTask(request.user!.id, id);
  }
}
