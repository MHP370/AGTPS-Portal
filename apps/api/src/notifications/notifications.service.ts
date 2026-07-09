import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webPush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import { PushSubscriptionDto } from './dto/push-subscription.dto';

type AuthenticatedUser = {
  id: string;
  username?: string;
  email?: string;
} | null;

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly vapidPublicKey?: string;
  private readonly vapidPrivateKey?: string;
  private pushInterval?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.vapidPublicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    this.vapidPrivateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');

    if (this.vapidPublicKey && this.vapidPrivateKey) {
      webPush.setVapidDetails(
        this.configService.get<string>('VAPID_SUBJECT') ??
          'mailto:admin@agtps.local',
        this.vapidPublicKey,
        this.vapidPrivateKey,
      );
    }
  }

  onModuleInit() {
    this.pushInterval = setInterval(() => {
      void this.sendReadyPushNotifications();
    }, 60_000);

    void this.sendReadyPushNotifications();
  }

  onModuleDestroy() {
    if (this.pushInterval) {
      clearInterval(this.pushInterval);
    }
  }

  getPushConfig() {
    return {
      enabled: Boolean(this.vapidPublicKey && this.vapidPrivateKey),
      publicKey: this.vapidPublicKey ?? null,
    };
  }

  async findAll(currentUser?: AuthenticatedUser) {
    const recipientWhere =
      await this.getNotificationRecipientWhere(currentUser);

    return this.prisma.portalNotification.findMany({
      where: {
        AND: [
          recipientWhere,
          {
            OR: [
              {
                scheduledAt: null,
              },
              {
                scheduledAt: {
                  lte: new Date(),
                },
              },
            ],
          },
        ],
      },
      include: {
        meeting: true,
        reminder: true,
        task: true,
        recipientDirectoryUser: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 30,
    });
  }

  markRead(id: string) {
    return this.prisma.portalNotification.update({
      where: { id },
      data: {
        readAt: new Date(),
      },
    });
  }

  private getNotificationTargetUrl(notification: {
    meetingId: string | null;
    reminderId: string | null;
    taskId: string | null;
  }) {
    if (notification.meetingId) {
      return `/?notification=${notification.meetingId}&type=meeting`;
    }

    if (notification.reminderId) {
      return `/?notification=${notification.reminderId}&type=reminder`;
    }

    if (notification.taskId) {
      return `/?notification=${notification.taskId}&type=task`;
    }

    return '/';
  }

  private async getNotificationRecipientWhere(currentUser?: AuthenticatedUser) {
    if (!currentUser) {
      return {
        recipientDirectoryUserId: null,
        recipientEmail: null,
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
      OR: [
        {
          recipientDirectoryUserId: null,
          recipientEmail: null,
        },
        ...(directoryUser
          ? [
              {
                recipientDirectoryUserId: directoryUser.id,
              },
            ]
          : []),
        ...(currentUser.email
          ? [
              {
                recipientEmail: currentUser.email,
              },
            ]
          : []),
      ],
    };
  }

  subscribe(dto: PushSubscriptionDto) {
    return this.prisma.pushSubscription.upsert({
      where: {
        endpoint: dto.endpoint,
      },
      update: {
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: dto.userAgent,
        recipientDirectoryUserId: dto.recipientDirectoryUserId,
        recipientEmail: dto.recipientEmail,
      },
      create: {
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: dto.userAgent,
        recipientDirectoryUserId: dto.recipientDirectoryUserId,
        recipientEmail: dto.recipientEmail,
      },
    });
  }

  async unsubscribe(dto: PushSubscriptionDto) {
    await this.prisma.pushSubscription.deleteMany({
      where: {
        endpoint: dto.endpoint,
      },
    });

    return {
      ok: true,
    };
  }

  async sendReadyPushNotifications() {
    if (!this.vapidPublicKey || !this.vapidPrivateKey) {
      return;
    }

    const notifications = await this.prisma.portalNotification.findMany({
      where: {
        sentAt: null,
        OR: [
          {
            scheduledAt: null,
          },
          {
            scheduledAt: {
              lte: new Date(),
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 25,
    });

    for (const notification of notifications) {
      const subscriptions = await this.prisma.pushSubscription.findMany({
        where: this.getSubscriptionRecipientWhere(notification),
      });

      await Promise.all(
        subscriptions.map((subscription) =>
          this.sendPushToSubscription(subscription, {
            title: notification.title,
            body: notification.body ?? 'اعلان جدید در پورتال',
            notificationId: notification.id,
            url: this.getNotificationTargetUrl(notification),
          }),
        ),
      );

      await this.prisma.portalNotification.update({
        where: {
          id: notification.id,
        },
        data: {
          sentAt: new Date(),
        },
      });
    }
  }

  private getSubscriptionRecipientWhere(notification: {
    recipientDirectoryUserId: string | null;
    recipientEmail: string | null;
  }) {
    if (notification.recipientDirectoryUserId) {
      return {
        recipientDirectoryUserId: notification.recipientDirectoryUserId,
      };
    }

    if (notification.recipientEmail) {
      return {
        recipientEmail: notification.recipientEmail,
      };
    }

    return {
      recipientDirectoryUserId: null,
      recipientEmail: null,
    };
  }

  private async sendPushToSubscription(
    subscription: {
      id: string;
      endpoint: string;
      p256dh: string;
      auth: string;
    },
    payload: {
      title: string;
      body: string;
      notificationId: string;
      url: string;
    },
  ) {
    try {
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        JSON.stringify(payload),
      );
    } catch (error) {
      const statusCode =
        typeof error === 'object' && error && 'statusCode' in error
          ? error.statusCode
          : undefined;

      if (statusCode === 404 || statusCode === 410) {
        await this.prisma.pushSubscription.delete({
          where: {
            id: subscription.id,
          },
        });
        return;
      }

      this.logger.warn(`Push notification failed for ${subscription.id}`);
    }
  }
}
