import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includePrivate = false) {
    return this.prisma.meeting.findMany({
      where: includePrivate
        ? undefined
        : {
            visibility: 'PUBLIC',
          },
      include: {
        organizer: true,
        organizerDirectoryUser: true,
        participants: {
          include: {
            user: true,
            directoryUser: true,
          },
        },
      },
      orderBy: {
        startAt: 'asc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.meeting.findUnique({
      where: { id },
      include: {
        organizer: true,
        organizerDirectoryUser: true,
        participants: {
          include: {
            user: true,
            directoryUser: true,
          },
        },
      },
    });
  }

  async create(dto: CreateMeetingDto) {
    const { participants, startAt, endAt, ...data } = dto;

    const meeting = await this.prisma.meeting.create({
      data: {
        ...data,
        startAt: new Date(startAt),
        endAt: endAt ? new Date(endAt) : null,
        participants: participants?.length
          ? {
              create: participants.map((participant) => ({
                userId: participant.userId,
                directoryUserId: participant.directoryUserId,
                displayName: participant.displayName,
                email: participant.email,
              })),
            }
          : undefined,
      },
      include: {
        participants: true,
      },
    });

    await this.createMeetingNotifications(
      meeting.id,
      meeting.title,
      participants ?? [],
      NotificationType.MEETING_INVITE,
    );

    return meeting;
  }

  async update(id: string, dto: UpdateMeetingDto) {
    const { participants, startAt, endAt, ...data } = dto;

    const meeting = await this.prisma.meeting.update({
      where: { id },
      data: {
        ...data,
        ...(startAt && {
          startAt: new Date(startAt),
        }),
        ...(endAt !== undefined && {
          endAt: endAt ? new Date(endAt) : null,
        }),
        ...(participants && {
          participants: {
            deleteMany: {},
            create: participants.map((participant) => ({
              userId: participant.userId,
              directoryUserId: participant.directoryUserId,
              displayName: participant.displayName,
              email: participant.email,
            })),
          },
        }),
      },
      include: {
        participants: true,
      },
    });

    if (participants) {
      await this.createMeetingNotifications(
        meeting.id,
        meeting.title,
        participants,
        NotificationType.MEETING_UPDATE,
      );
    }

    return meeting;
  }

  remove(id: string) {
    return this.prisma.meeting.delete({
      where: { id },
    });
  }

  private async createMeetingNotifications(
    meetingId: string,
    meetingTitle: string,
    participants: CreateMeetingDto['participants'],
    type: NotificationType,
  ) {
    const cleanParticipants = (participants ?? []).filter(
      (participant) =>
        participant.directoryUserId || participant.email,
    );

    if (cleanParticipants.length === 0) return;

    await this.prisma.portalNotification.createMany({
      data: cleanParticipants.map((participant) => ({
        type,
        title:
          type === NotificationType.MEETING_INVITE
            ? 'دعوت به جلسه'
            : 'به‌روزرسانی جلسه',
        body: meetingTitle,
        meetingId,
        recipientDirectoryUserId: participant.directoryUserId,
        recipientEmail: participant.email,
      })),
    });
  }
}
