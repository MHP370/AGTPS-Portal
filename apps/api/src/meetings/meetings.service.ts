import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';

type AuthenticatedUser = {
  id: string;
  username?: string;
  email?: string;
} | null;

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includePrivate = false, currentUser?: AuthenticatedUser) {
    const where = includePrivate
      ? undefined
      : await this.getVisibleMeetingWhere(currentUser);

    return this.prisma.meeting.findMany({
      where,
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

  async findOne(id: string, currentUser?: AuthenticatedUser) {
    const visibleWhere = await this.getVisibleMeetingWhere(currentUser);
    const meeting = await this.prisma.meeting.findFirst({
      where: {
        id,
        ...(visibleWhere ?? {}),
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
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return meeting;
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

  private async getVisibleMeetingWhere(currentUser?: AuthenticatedUser) {
    if (!currentUser) {
      return {
        isPublished: true,
        visibility: 'PUBLIC' as const,
      };
    }

    const directoryUser = await this.prisma.directoryUser.findFirst({
      where: {
        isActive: true,
        OR: [
          ...(currentUser.username ? [{ username: currentUser.username }] : []),
          ...(currentUser.email ? [{ email: currentUser.email }] : []),
        ],
      },
    });

    return {
      AND: [
        {
          isPublished: true,
        },
        {
          OR: [
            {
              visibility: 'PUBLIC' as const,
            },
            {
              organizerId: currentUser.id,
            },
            {
              participants: {
                some: {
                  userId: currentUser.id,
                },
              },
            },
            ...(directoryUser
              ? [
                  {
                    organizerDirectoryUserId: directoryUser.id,
                  },
                  {
                    participants: {
                      some: {
                        directoryUserId: directoryUser.id,
                      },
                    },
                  },
                ]
              : []),
            ...(currentUser.email
              ? [
                  {
                    participants: {
                      some: {
                        email: currentUser.email,
                      },
                    },
                  },
                ]
              : []),
          ],
        },
      ],
    };
  }

  private async createMeetingNotifications(
    meetingId: string,
    meetingTitle: string,
    participants: CreateMeetingDto['participants'],
    type: NotificationType,
  ) {
    const cleanParticipants = (participants ?? []).filter(
      (participant) => participant.directoryUserId || participant.email,
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
