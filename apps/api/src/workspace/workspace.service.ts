import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  findNotes() {
    return this.prisma.portalNote.findMany({
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
    });
  }

  createNote(dto: CreateNoteDto) {
    return this.prisma.portalNote.create({
      data: dto,
    });
  }

  updateNote(id: string, dto: UpdateNoteDto) {
    return this.prisma.portalNote.update({
      where: { id },
      data: dto,
    });
  }

  removeNote(id: string) {
    return this.prisma.portalNote.delete({
      where: { id },
    });
  }

  findReminders() {
    return this.prisma.portalReminder.findMany({
      orderBy: {
        remindAt: 'asc',
      },
    });
  }

  createReminder(dto: CreateReminderDto) {
    return this.prisma.portalReminder.create({
      data: {
        ...dto,
        remindAt: new Date(dto.remindAt),
      },
    });
  }

  updateReminder(id: string, dto: UpdateReminderDto) {
    return this.prisma.portalReminder.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.remindAt && {
          remindAt: new Date(dto.remindAt),
        }),
      },
    });
  }

  removeReminder(id: string) {
    return this.prisma.portalReminder.delete({
      where: { id },
    });
  }

  findTasks() {
    return this.prisma.portalTask.findMany({
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });
  }

  createTask(dto: CreateTaskDto) {
    return this.prisma.portalTask.create({
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
    });
  }

  updateTask(id: string, dto: UpdateTaskDto) {
    return this.prisma.portalTask.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.dueDate !== undefined && {
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        }),
      },
    });
  }

  removeTask(id: string) {
    return this.prisma.portalTask.delete({
      where: { id },
    });
  }
}
