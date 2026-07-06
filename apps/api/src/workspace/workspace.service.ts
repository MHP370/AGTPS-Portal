import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

type AuthenticatedUser = {
  id: string;
  username?: string;
  email?: string;
};

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  findNotes(ownerId?: string) {
    if (!ownerId) return [];

    return this.prisma.portalNote.findMany({
      where: {
        ownerId,
      },
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
    });
  }

  createNote(ownerId: string, dto: CreateNoteDto) {
    return this.prisma.portalNote.create({
      data: {
        ...dto,
        ownerId,
      },
    });
  }

  updateNote(ownerId: string, id: string, dto: UpdateNoteDto) {
    return this.prisma.portalNote.update({
      where: {
        id,
        ownerId,
      },
      data: dto,
    });
  }

  removeNote(ownerId: string, id: string) {
    return this.prisma.portalNote.delete({
      where: {
        id,
        ownerId,
      },
    });
  }

  findReminders(ownerId?: string) {
    if (!ownerId) return [];

    return this.prisma.portalReminder.findMany({
      where: {
        ownerId,
      },
      orderBy: {
        remindAt: 'asc',
      },
    });
  }

  createReminder(user: AuthenticatedUser, dto: CreateReminderDto) {
    return this.prisma.portalReminder.create({
      data: {
        ...dto,
        ownerId: user.id,
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
        recipientEmail: user.email,
        scheduledAt: this.getScheduledNotificationTime(
          reminder.remindAt,
          reminder.notifyBeforeMinutes,
        ),
      });

      return reminder;
    });
  }

  updateReminder(
    ownerId: string,
    id: string,
    dto: UpdateReminderDto,
  ) {
    return this.prisma.portalReminder.update({
      where: {
        id,
        ownerId,
      },
      data: {
        ...dto,
        ...(dto.remindAt && {
          remindAt: new Date(dto.remindAt),
        }),
      },
    });
  }

  removeReminder(ownerId: string, id: string) {
    return this.prisma.portalReminder.delete({
      where: {
        id,
        ownerId,
      },
    });
  }

  findTasks(ownerId?: string) {
    if (!ownerId) return [];

    return this.prisma.portalTask.findMany({
      where: {
        ownerId,
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });
  }

  createTask(user: AuthenticatedUser, dto: CreateTaskDto) {
    return this.prisma.portalTask.create({
      data: {
        ...dto,
        ownerId: user.id,
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
          recipientEmail: user.email,
          scheduledAt: this.getScheduledNotificationTime(
            task.dueDate,
            task.notifyBeforeMinutes,
          ),
        });
      }

      return task;
    });
  }

  updateTask(ownerId: string, id: string, dto: UpdateTaskDto) {
    return this.prisma.portalTask.update({
      where: {
        id,
        ownerId,
      },
      data: {
        ...dto,
        ...(dto.dueDate !== undefined && {
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        }),
      },
    });
  }

  removeTask(ownerId: string, id: string) {
    return this.prisma.portalTask.delete({
      where: {
        id,
        ownerId,
      },
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
    recipientEmail?: string;
    scheduledAt: Date;
  }) {
    return this.prisma.portalNotification.create({
      data,
    });
  }
}
