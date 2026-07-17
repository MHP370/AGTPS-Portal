import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

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

    const directoryUsers = await this.prisma.directoryUser.findMany({
      where: {
        id: {
          in: cleanParticipants
            .map((participant) => participant.directoryUserId)
            .filter((id): id is string => Boolean(id)),
        },
      },
      select: {
        id: true,
        displayName: true,
        email: true,
      },
    });
    const directoryUserMap = new Map(
      directoryUsers.map((user) => [user.id, user]),
    );
    const isInvite = type === NotificationType.MEETING_INVITE;
    const title = isInvite ? 'دعوت به جلسه' : 'به‌روزرسانی جلسه';
    const meeting = await this.prisma.meeting.findUnique({
      where: {
        id: meetingId,
      },
      select: {
        startAt: true,
        location: true,
        description: true,
      },
    });
    const meetingTime = meeting?.startAt
      ? new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(meeting.startAt)
      : '';

    await Promise.all(
      cleanParticipants.map(async (participant) => {
        const directoryUser = participant.directoryUserId
          ? directoryUserMap.get(participant.directoryUserId)
          : null;
        const recipientEmail = participant.email || directoryUser?.email || null;
        const recipientName =
          participant.displayName || directoryUser?.displayName || '';

        await this.notificationsService.dispatchEvent({
          eventKey: isInvite ? 'meeting.invite' : 'meeting.update',
          portal: {
            type,
            title,
            body: meetingTitle,
            meetingId,
            recipientDirectoryUserId: participant.directoryUserId,
            recipientEmail,
          },
          email: recipientEmail
            ? {
                fallbackTemplateKey: 'meeting-invite',
                recipientEmail,
                recipientName,
                priority: isInvite ? 20 : 30,
                variables: {
                  UserName: recipientName,
                  Title: meetingTitle,
                  MeetingTime: meetingTime,
                  Location: meeting?.location || '-',
                  Description: meeting?.description || '',
                  ButtonUrl: `${process.env.PORTAL_URL || ''}/?notification=${meetingId}&type=meeting`,
                },
              }
            : undefined,
        });
      }),
    );
  }
}
