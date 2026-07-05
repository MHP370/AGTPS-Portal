import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { WorkspaceService } from './workspace.service';

@Controller('workspace')
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceService,
  ) {}

  @Get('notes')
  findNotes() {
    return this.workspaceService.findNotes();
  }

  @Post('notes')
  createNote(@Body() dto: CreateNoteDto) {
    return this.workspaceService.createNote(dto);
  }

  @Put('notes/:id')
  updateNote(
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.workspaceService.updateNote(id, dto);
  }

  @Delete('notes/:id')
  removeNote(@Param('id') id: string) {
    return this.workspaceService.removeNote(id);
  }

  @Get('reminders')
  findReminders() {
    return this.workspaceService.findReminders();
  }

  @Post('reminders')
  createReminder(@Body() dto: CreateReminderDto) {
    return this.workspaceService.createReminder(dto);
  }

  @Put('reminders/:id')
  updateReminder(
    @Param('id') id: string,
    @Body() dto: UpdateReminderDto,
  ) {
    return this.workspaceService.updateReminder(id, dto);
  }

  @Delete('reminders/:id')
  removeReminder(@Param('id') id: string) {
    return this.workspaceService.removeReminder(id);
  }

  @Get('tasks')
  findTasks() {
    return this.workspaceService.findTasks();
  }

  @Post('tasks')
  createTask(@Body() dto: CreateTaskDto) {
    return this.workspaceService.createTask(dto);
  }

  @Put('tasks/:id')
  updateTask(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.workspaceService.updateTask(id, dto);
  }

  @Delete('tasks/:id')
  removeTask(@Param('id') id: string) {
    return this.workspaceService.removeTask(id);
  }
}
