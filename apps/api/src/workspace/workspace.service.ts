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
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
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
    return this.prisma.portalReminder
      .create({
        data: {
          ...dto,
          ownerId: user.id,
          remindAt: new Date(dto.remindAt),
          ...(dto.notifyBeforeMinutes !== undefined && {
            notifyBeforeMinutes: dto.notifyBeforeMinutes,
          }),
        },
      })
      .then(async (reminder) => {
        await this.createNotification({
          type: NotificationType.REMINDER,
          title: 'یادآوری',
          body: reminder.title,
          recipientEmail: user.email,
          reminderId: reminder.id,
          scheduledAt: this.getScheduledNotificationTime(
            reminder.remindAt,
            reminder.notifyBeforeMinutes,
          ),
        });

        return reminder;
      });
  }

  async updateReminder(ownerId: string, id: string, dto: UpdateReminderDto) {
    const reminder = await this.prisma.portalReminder.update({
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

    await this.syncReminderNotification(ownerId, reminder);

    return reminder;
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
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });
  }

  createTask(user: AuthenticatedUser, dto: CreateTaskDto) {
    return this.prisma.portalTask
      .create({
        data: {
          ...dto,
          ownerId: user.id,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          ...(dto.notifyBeforeMinutes !== undefined && {
            notifyBeforeMinutes: dto.notifyBeforeMinutes,
          }),
        },
      })
      .then(async (task) => {
        if (task.dueDate) {
          await this.createNotification({
            type: NotificationType.TASK,
            title: 'یادآوری کار',
            body: task.title,
            recipientEmail: user.email,
            taskId: task.id,
            scheduledAt: this.getScheduledNotificationTime(
              task.dueDate,
              task.notifyBeforeMinutes,
            ),
          });
        }

        return task;
      });
  }

  async updateTask(ownerId: string, id: string, dto: UpdateTaskDto) {
    const task = await this.prisma.portalTask.update({
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

    await this.syncTaskNotification(ownerId, task);

    return task;
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
    reminderId?: string;
    taskId?: string;
  }) {
    return this.prisma.portalNotification.create({
      data,
    });
  }

  private async syncReminderNotification(
    ownerId: string,
    reminder: {
      id: string;
      title: string;
      remindAt: Date;
      notifyBeforeMinutes: number | null;
      completed: boolean;
    },
  ) {
    const owner = await this.prisma.user.findUnique({
      where: {
        id: ownerId,
      },
      select: {
        email: true,
      },
    });

    await this.prisma.portalNotification.upsert({
      where: {
        id:
          (
            await this.prisma.portalNotification.findFirst({
              where: {
                reminderId: reminder.id,
              },
              select: {
                id: true,
              },
            })
          )?.id ?? '__missing_reminder_notification__',
      },
      update: {
        title: 'یادآوری',
        body: reminder.title,
        recipientEmail: owner?.email,
        scheduledAt: this.getScheduledNotificationTime(
          reminder.remindAt,
          reminder.notifyBeforeMinutes,
        ),
        sentAt: reminder.completed ? new Date() : null,
        readAt: reminder.completed ? new Date() : null,
      },
      create: {
        type: NotificationType.REMINDER,
        title: 'یادآوری',
        body: reminder.title,
        recipientEmail: owner?.email,
        reminderId: reminder.id,
        scheduledAt: this.getScheduledNotificationTime(
          reminder.remindAt,
          reminder.notifyBeforeMinutes,
        ),
        sentAt: reminder.completed ? new Date() : null,
        readAt: reminder.completed ? new Date() : null,
      },
    });
  }

  private async syncTaskNotification(
    ownerId: string,
    task: {
      id: string;
      title: string;
      dueDate: Date | null;
      notifyBeforeMinutes: number | null;
      status: string;
    },
  ) {
    if (!task.dueDate) {
      await this.prisma.portalNotification.deleteMany({
        where: {
          taskId: task.id,
        },
      });
      return;
    }

    const owner = await this.prisma.user.findUnique({
      where: {
        id: ownerId,
      },
      select: {
        email: true,
      },
    });
    const isDone = task.status === 'DONE';

    await this.prisma.portalNotification.upsert({
      where: {
        id:
          (
            await this.prisma.portalNotification.findFirst({
              where: {
                taskId: task.id,
              },
              select: {
                id: true,
              },
            })
          )?.id ?? '__missing_task_notification__',
      },
      update: {
        title: 'یادآوری کار',
        body: task.title,
        recipientEmail: owner?.email,
        scheduledAt: this.getScheduledNotificationTime(
          task.dueDate,
          task.notifyBeforeMinutes,
        ),
        sentAt: isDone ? new Date() : null,
        readAt: isDone ? new Date() : null,
      },
      create: {
        type: NotificationType.TASK,
        title: 'یادآوری کار',
        body: task.title,
        recipientEmail: owner?.email,
        taskId: task.id,
        scheduledAt: this.getScheduledNotificationTime(
          task.dueDate,
          task.notifyBeforeMinutes,
        ),
        sentAt: isDone ? new Date() : null,
        readAt: isDone ? new Date() : null,
      },
    });
  }
}
