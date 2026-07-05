import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
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
        ...(dto.notifyBeforeMinutes !== undefined && {
          notifyBeforeMinutes: dto.notifyBeforeMinutes,
        }),
      },
    }).then(async (reminder) => {
      await this.createNotification({
        type: NotificationType.REMINDER,
        title: 'یادآوری',
        body: reminder.title,
        scheduledAt: this.getScheduledNotificationTime(
          reminder.remindAt,
          reminder.notifyBeforeMinutes,
        ),
      });

      return reminder;
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
        ...(dto.notifyBeforeMinutes !== undefined && {
          notifyBeforeMinutes: dto.notifyBeforeMinutes,
        }),
      },
    }).then(async (task) => {
      if (task.dueDate) {
        await this.createNotification({
          type: NotificationType.TASK,
          title: 'یادآوری کار',
          body: task.title,
          scheduledAt: this.getScheduledNotificationTime(
            task.dueDate,
            task.notifyBeforeMinutes,
          ),
        });
      }

      return task;
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

  private getScheduledNotificationTime(
    date: Date,
    notifyBeforeMinutes?: number | null,
  ) {
    if (!notifyBeforeMinutes) return date;

    return new Date(date.getTime() - notifyBeforeMinutes * 60 * 1000);
  }

  private createNotification(data: {
    type: NotificationType;
    title: string;
    body: string;
    scheduledAt: Date;
  }) {
    return this.prisma.portalNotification.create({
      data,
    });
  }
}
