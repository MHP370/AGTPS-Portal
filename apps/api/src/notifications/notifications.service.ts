import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationQueueStatus,
  NotificationSmtpEncryption,
  NotificationTemplateStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import nodemailer from 'nodemailer';
import * as webPush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { CreateSmtpServerDto } from './dto/create-smtp-server.dto';
import { QueueEmailDto } from './dto/queue-email.dto';
import { PushSubscriptionDto } from './dto/push-subscription.dto';
import { TestSmtpDto } from './dto/test-smtp.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { UpdateNotificationRuleDto } from './dto/update-notification-rule.dto';
import { UpdateSmtpServerDto } from './dto/update-smtp-server.dto';

type AuthenticatedUser = {
  id: string;
  username?: string;
  email?: string;
} | null;

type PortalNotificationPayload = {
  type: NotificationType;
  title: string;
  body?: string | null;
  recipientDirectoryUserId?: string | null;
  recipientEmail?: string | null;
  meetingId?: string | null;
  reminderId?: string | null;
  taskId?: string | null;
  trainingId?: string | null;
  eventKey?: string | null;
  targetUrl?: string | null;
  scheduledAt?: Date | null;
  sentAt?: Date | null;
  readAt?: Date | null;
};

type TemplateEmailPayload = Omit<QueueEmailDto, 'templateId'> & {
  templateKey: string;
};

type NotificationEventPayload = {
  eventKey: string;
  portal?: PortalNotificationPayload;
  email?: Omit<QueueEmailDto, 'templateId'> & {
    fallbackTemplateKey?: string;
  };
};

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly vapidPublicKey?: string;
  private readonly vapidPrivateKey?: string;
  private pushInterval?: NodeJS.Timeout;
  private emailQueueInterval?: NodeJS.Timeout;
  private emailQueueProcessing = false;

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
    this.emailQueueInterval = setInterval(() => {
      void this.processEmailQueueSafely();
    }, 60_000);

    void this.sendReadyPushNotifications();
    void this.processEmailQueueSafely();
  }

  onModuleDestroy() {
    if (this.pushInterval) {
      clearInterval(this.pushInterval);
    }

    if (this.emailQueueInterval) {
      clearInterval(this.emailQueueInterval);
    }
  }

  getPushConfig() {
    return {
      enabled: Boolean(this.vapidPublicKey && this.vapidPrivateKey),
      publicKey: this.vapidPublicKey ?? null,
    };
  }

  findSmtpServers() {
    return this.prisma.notificationSmtpServer.findMany({
      orderBy: [
        {
          isPrimary: 'desc',
        },
        {
          priority: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    }).then((servers) => servers.map((server) => this.maskSmtpServer(server)));
  }

  async createSmtpServer(dto: CreateSmtpServerDto) {
    if (dto.isPrimary) {
      await this.clearPrimarySmtpServer();
    }

    const server = await this.prisma.notificationSmtpServer.create({
      data: this.normalizeSmtpCreateDto(dto),
    });

    return this.maskSmtpServer(server);
  }

  async updateSmtpServer(id: string, dto: UpdateSmtpServerDto) {
    await this.prisma.notificationSmtpServer.findUniqueOrThrow({
      where: {
        id,
      },
    });

    if (dto.isPrimary) {
      await this.clearPrimarySmtpServer(id);
    }

    const server = await this.prisma.notificationSmtpServer.update({
      where: {
        id,
      },
      data: this.normalizeSmtpDto(dto),
    });

    return this.maskSmtpServer(server);
  }

  deleteSmtpServer(id: string) {
    return this.prisma.notificationSmtpServer.delete({
      where: {
        id,
      },
    });
  }

  async testSmtpServer(id: string, dto: TestSmtpDto) {
    const server = await this.prisma.notificationSmtpServer.findUniqueOrThrow({
      where: {
        id,
      },
    });

    try {
      const transporter = this.createTransporter(server);
      await transporter.verify();

      if (dto.recipientEmail) {
        await transporter.sendMail({
          from: this.formatSender(server),
          to: dto.recipientEmail,
          replyTo: server.replyTo || undefined,
          subject: dto.subject || 'AGTPS Portal SMTP Test',
          html:
            dto.body ||
            this.wrapEmailHtml(
              'تست ارسال ایمیل',
              'تنظیمات SMTP در مرکز اعلان‌های AGTPS Portal با موفقیت تست شد.',
            ),
          text:
            dto.body ||
            'تنظیمات SMTP در مرکز اعلان‌های AGTPS Portal با موفقیت تست شد.',
        });
      }

      const updated = await this.prisma.notificationSmtpServer.update({
        where: {
          id,
        },
        data: {
          lastTestStatus: 'success',
          lastTestError: null,
          lastTestedAt: new Date(),
        },
      });

      return {
        ok: true,
        server: this.maskSmtpServer(updated),
      };
    } catch (error) {
      const message = this.getErrorMessage(error);
      const updated = await this.prisma.notificationSmtpServer.update({
        where: {
          id,
        },
        data: {
          lastTestStatus: 'failed',
          lastTestError: message,
          lastTestedAt: new Date(),
        },
      });

      return {
        ok: false,
        error: message,
        server: this.maskSmtpServer(updated),
      };
    }
  }

  findTemplates() {
    return this.prisma.notificationTemplate.findMany({
      orderBy: [
        {
          category: 'asc',
        },
        {
          title: 'asc',
        },
      ],
    });
  }

  createTemplate(dto: CreateNotificationTemplateDto) {
    return this.prisma.notificationTemplate.create({
      data: {
        ...dto,
        variables: dto.variables as Prisma.InputJsonValue,
      },
    });
  }

  updateTemplate(id: string, dto: UpdateNotificationTemplateDto) {
    return this.prisma.notificationTemplate.update({
      where: {
        id,
      },
      data: {
        ...dto,
        variables: dto.variables as Prisma.InputJsonValue,
      },
    });
  }

  deleteTemplate(id: string) {
    return this.prisma.notificationTemplate.delete({
      where: {
        id,
      },
    });
  }

  findRules() {
    return this.prisma.notificationRule.findMany({
      include: {
        emailTemplate: true,
      },
      orderBy: [
        {
          moduleKey: 'asc',
        },
        {
          priority: 'asc',
        },
        {
          title: 'asc',
        },
      ],
    });
  }

  updateRule(id: string, dto: UpdateNotificationRuleDto) {
    return this.prisma.notificationRule.update({
      where: {
        id,
      },
      data: {
        ...dto,
        emailTemplateId:
          dto.emailTemplateId === '' ? null : dto.emailTemplateId,
      },
      include: {
        emailTemplate: true,
      },
    });
  }

  async queueEmail(dto: QueueEmailDto) {
    const rendered = await this.renderQueuedEmail(dto);

    return this.prisma.notificationEmailQueue.create({
      data: {
        recipientEmail: dto.recipientEmail,
        recipientName: dto.recipientName,
        templateId: dto.templateId,
        subject: rendered.subject,
        htmlBody: rendered.htmlBody,
        textBody: rendered.textBody,
        maxRetry: dto.maxRetry ?? 3,
        priority: dto.priority ?? 100,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        metadata: dto.variables as Prisma.InputJsonValue,
      },
    });
  }

  createPortalNotification(data: PortalNotificationPayload) {
    return this.prisma.portalNotification.create({
      data,
    });
  }

  async queueTemplateEmailByKey(dto: TemplateEmailPayload) {
    const template = await this.prisma.notificationTemplate.findFirst({
      where: {
        key: dto.templateKey,
        status: NotificationTemplateStatus.PUBLISHED,
      },
      select: {
        id: true,
      },
    });

    if (!template) {
      return this.queueEmail({
        ...dto,
        subject: dto.subject ?? dto.variables?.Title?.toString() ?? 'AGTPS Portal',
        htmlBody:
          dto.htmlBody ??
          this.wrapEmailHtml(
            dto.variables?.Title?.toString() ?? 'AGTPS Portal',
            dto.variables?.Message?.toString() ?? '',
          ),
      });
    }

    return this.queueEmail({
      ...dto,
      templateId: template.id,
    });
  }

  async dispatchEvent(payload: NotificationEventPayload) {
    const rule = await this.prisma.notificationRule.findUnique({
      where: {
        eventKey: payload.eventKey,
      },
      include: {
        emailTemplate: true,
      },
    });

    const isActive = rule?.isActive ?? true;
    const portalEnabled = isActive && (rule?.portalEnabled ?? true);
    const emailEnabled = isActive && (rule?.emailEnabled ?? false);
    const result: {
      portalNotification?: unknown;
      email?: unknown;
      rule?: unknown;
    } = {
      rule,
    };

    if (portalEnabled && payload.portal) {
      result.portalNotification = await this.createPortalNotification(
        payload.portal,
      );
    }

    if (emailEnabled && payload.email?.recipientEmail) {
      if (rule?.emailTemplateId) {
        result.email = await this.queueEmail({
          ...payload.email,
          templateId: rule.emailTemplateId,
          priority: payload.email.priority ?? rule.priority,
        });
      } else if (payload.email.fallbackTemplateKey) {
        result.email = await this.queueTemplateEmailByKey({
          ...payload.email,
          templateKey: payload.email.fallbackTemplateKey,
          priority: payload.email.priority ?? rule?.priority,
        });
      } else {
        result.email = await this.queueEmail({
          ...payload.email,
          priority: payload.email.priority ?? rule?.priority,
        });
      }
    }

    return result;
  }

  findEmailQueue() {
    return this.prisma.notificationEmailQueue.findMany({
      take: 200,
      include: {
        template: true,
        smtpServer: {
          select: {
            id: true,
            name: true,
            host: true,
            senderEmail: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async processEmailQueue(limit = 25) {
    const emails = await this.prisma.notificationEmailQueue.findMany({
      where: {
        status: {
          in: [
            NotificationQueueStatus.PENDING,
            NotificationQueueStatus.RETRY,
          ],
        },
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
      orderBy: [
        {
          priority: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
      take: limit,
    });

    const results: unknown[] = [];

    for (const email of emails) {
      results.push(await this.sendQueuedEmail(email.id));
    }

    return {
      processed: results.length,
      results,
    };
  }

  private async processEmailQueueSafely() {
    if (this.emailQueueProcessing) return;

    this.emailQueueProcessing = true;

    try {
      await this.processEmailQueue();
    } catch (error) {
      this.logger.warn(
        `Email queue processing failed: ${this.getErrorMessage(error)}`,
      );
    } finally {
      this.emailQueueProcessing = false;
    }
  }

  async sendQueuedEmail(id: string) {
    const email = await this.prisma.notificationEmailQueue.findUniqueOrThrow({
      where: {
        id,
      },
    });
    const servers = await this.getActiveSmtpServers();

    if (servers.length === 0) {
      throw new BadRequestException('هیچ SMTP فعالی برای ارسال ایمیل تعریف نشده است.');
    }

    await this.prisma.notificationEmailQueue.update({
      where: {
        id,
      },
      data: {
        status: NotificationQueueStatus.SENDING,
        sendingAt: new Date(),
        failureReason: null,
      },
    });

    let lastError = '';

    for (const server of servers) {
      try {
        const transporter = this.createTransporter(server);
        const result = await transporter.sendMail({
          from: this.formatSender(server),
          to: email.recipientName
            ? `"${email.recipientName}" <${email.recipientEmail}>`
            : email.recipientEmail,
          replyTo: server.replyTo || undefined,
          subject: email.subject,
          html: email.htmlBody,
          text: email.textBody || undefined,
        });

        return this.prisma.notificationEmailQueue.update({
          where: {
            id,
          },
          data: {
            status: NotificationQueueStatus.SENT,
            smtpServerId: server.id,
            sentAt: new Date(),
            messageId: result.messageId,
            failureReason: null,
          },
        });
      } catch (error) {
        lastError = this.getErrorMessage(error);
      }
    }

    const retryCount = email.retryCount + 1;
    const shouldRetry = retryCount < email.maxRetry;

    return this.prisma.notificationEmailQueue.update({
      where: {
        id,
      },
      data: {
        status: shouldRetry
          ? NotificationQueueStatus.RETRY
          : NotificationQueueStatus.FAILED,
        retryCount,
        failedAt: shouldRetry ? null : new Date(),
        failureReason: lastError || 'Email delivery failed.',
      },
    });
  }

  async cancelQueuedEmail(id: string) {
    return this.prisma.notificationEmailQueue.update({
      where: {
        id,
      },
      data: {
        status: NotificationQueueStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
  }

  async getNotificationCenterStats() {
    const [smtpCount, templateCount, pending, sent, failed] =
      await Promise.all([
        this.prisma.notificationSmtpServer.count({
          where: {
            isActive: true,
          },
        }),
        this.prisma.notificationTemplate.count(),
        this.prisma.notificationEmailQueue.count({
          where: {
            status: {
              in: [
                NotificationQueueStatus.PENDING,
                NotificationQueueStatus.RETRY,
              ],
            },
          },
        }),
        this.prisma.notificationEmailQueue.count({
          where: {
            status: NotificationQueueStatus.SENT,
          },
        }),
        this.prisma.notificationEmailQueue.count({
          where: {
            status: NotificationQueueStatus.FAILED,
          },
        }),
      ]);

    return {
      smtpCount,
      templateCount,
      pending,
      sent,
      failed,
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

  async markRead(id: string, currentUser?: AuthenticatedUser) {
    if (!currentUser) {
      throw new ForbiddenException('برای تغییر وضعیت اعلان باید وارد شوید.');
    }

    const recipientWhere =
      await this.getNotificationRecipientWhere(currentUser);

    const result = await this.prisma.portalNotification.updateMany({
      where: {
        AND: [
          {
            id,
          },
          recipientWhere,
        ],
      },
      data: {
        readAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Notification was not found.');
    }

    return this.prisma.portalNotification.findUnique({
      where: {
        id,
      },
      include: {
        meeting: true,
        reminder: true,
        task: true,
        recipientDirectoryUser: true,
      },
    });
  }

  async markAllRead(currentUser?: AuthenticatedUser) {
    if (!currentUser) {
      throw new ForbiddenException('برای تغییر وضعیت اعلان باید وارد شوید.');
    }

    const recipientWhere =
      await this.getNotificationRecipientWhere(currentUser);

    await this.prisma.portalNotification.updateMany({
      where: {
        AND: [
          recipientWhere,
          {
            readAt: null,
          },
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
      data: {
        readAt: new Date(),
      },
    });

    return {
      ok: true,
    };
  }

  private getNotificationTargetUrl(notification: {
    targetUrl: string | null;
    meetingId: string | null;
    reminderId: string | null;
    taskId: string | null;
  }) {
    if (notification.targetUrl) return notification.targetUrl;

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

  private clearPrimarySmtpServer(exceptId?: string) {
    return this.prisma.notificationSmtpServer.updateMany({
      where: {
        ...(exceptId ? { id: { not: exceptId } } : {}),
        isPrimary: true,
      },
      data: {
        isPrimary: false,
      },
    });
  }

  private normalizeSmtpDto(dto: Partial<CreateSmtpServerDto>) {
    const password =
      dto.password === undefined || dto.password === '__KEEP_EXISTING__'
        ? undefined
        : dto.password;

    return {
      ...dto,
      password,
      timeoutMs: dto.timeoutMs ?? undefined,
      maxRetry: dto.maxRetry ?? undefined,
      priority: dto.priority ?? undefined,
    };
  }

  private normalizeSmtpCreateDto(dto: CreateSmtpServerDto) {
    return {
      name: dto.name,
      host: dto.host,
      port: dto.port,
      username: dto.username,
      password: dto.password === '__KEEP_EXISTING__' ? undefined : dto.password,
      senderName: dto.senderName,
      senderEmail: dto.senderEmail,
      replyTo: dto.replyTo,
      encryption: dto.encryption,
      timeoutMs: dto.timeoutMs,
      maxRetry: dto.maxRetry,
      priority: dto.priority,
      isActive: dto.isActive,
      isPrimary: dto.isPrimary,
    };
  }

  private maskSmtpServer<T extends { password: string | null }>(server: T) {
    return {
      ...server,
      password: server.password ? '__CONFIGURED__' : null,
    };
  }

  private getActiveSmtpServers() {
    return this.prisma.notificationSmtpServer.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        {
          isPrimary: 'desc',
        },
        {
          priority: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });
  }

  private createTransporter(server: {
    host: string;
    port: number;
    username: string | null;
    password: string | null;
    encryption: NotificationSmtpEncryption;
    timeoutMs: number;
  }) {
    return nodemailer.createTransport({
      host: server.host,
      port: server.port,
      secure: server.encryption === NotificationSmtpEncryption.SSL,
      requireTLS:
        server.encryption === NotificationSmtpEncryption.TLS ||
        server.encryption === NotificationSmtpEncryption.STARTTLS,
      connectionTimeout: server.timeoutMs,
      greetingTimeout: server.timeoutMs,
      socketTimeout: server.timeoutMs,
      auth: server.username
        ? {
            user: server.username,
            pass: server.password || '',
          }
        : undefined,
      tls:
        server.encryption === NotificationSmtpEncryption.NONE
          ? {
              rejectUnauthorized: false,
            }
          : undefined,
    });
  }

  private formatSender(server: {
    senderName: string | null;
    senderEmail: string;
  }) {
    return server.senderName
      ? `"${server.senderName}" <${server.senderEmail}>`
      : server.senderEmail;
  }

  private async renderQueuedEmail(dto: QueueEmailDto) {
    const variables = {
      UserName: dto.recipientName || '',
      PortalUrl: this.configService.get<string>('PORTAL_URL') || '',
      CompanyName: 'AGTPS Portal',
      CurrentDate: new Date().toLocaleDateString('fa-IR-u-ca-persian'),
      ...(dto.variables ?? {}),
    };

    if (dto.templateId) {
      const template = await this.prisma.notificationTemplate.findUniqueOrThrow({
        where: {
          id: dto.templateId,
        },
      });

      return {
        subject: this.applyTemplateVariables(template.subject, variables),
        htmlBody: this.applyTemplateVariables(template.htmlBody, variables),
        textBody: template.textBody
          ? this.applyTemplateVariables(template.textBody, variables)
          : undefined,
      };
    }

    if (!dto.subject || !dto.htmlBody) {
      throw new BadRequestException(
        'برای ایمیل بدون قالب، subject و htmlBody الزامی هستند.',
      );
    }

    return {
      subject: this.applyTemplateVariables(dto.subject, variables),
      htmlBody: this.applyTemplateVariables(dto.htmlBody, variables),
      textBody: dto.textBody
        ? this.applyTemplateVariables(dto.textBody, variables)
        : undefined,
    };
  }

  private applyTemplateVariables(
    value: string,
    variables: Record<string, unknown>,
  ) {
    return value.replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (_, key) =>
      String(variables[key] ?? ''),
    );
  }

  private wrapEmailHtml(title: string, body: string) {
    return `
      <div dir="rtl" style="font-family: Vazirmatn, Tahoma, Arial, sans-serif; background:#020617; color:#e2e8f0; padding:24px;">
        <div style="max-width:640px; margin:auto; border:1px solid rgba(34,211,238,.25); border-radius:18px; overflow:hidden; background:#0f172a;">
          <div style="padding:20px 24px; background:linear-gradient(135deg, rgba(8,145,178,.35), rgba(15,23,42,.95));">
            <h1 style="margin:0; font-size:20px; color:#fff;">${title}</h1>
          </div>
          <div style="padding:24px; line-height:1.9; font-size:14px;">
            ${body}
          </div>
          <div style="padding:16px 24px; border-top:1px solid rgba(148,163,184,.18); color:#94a3b8; font-size:12px;">
            AGTPS Portal Notification Center
          </div>
        </div>
      </div>
    `;
  }

  private getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }

  async subscribe(dto: PushSubscriptionDto, currentUser?: AuthenticatedUser) {
    const recipient = await this.resolvePushRecipient(currentUser);

    return this.prisma.pushSubscription.upsert({
      where: {
        endpoint: dto.endpoint,
      },
      update: {
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: dto.userAgent,
        recipientDirectoryUserId: recipient.recipientDirectoryUserId,
        recipientEmail: recipient.recipientEmail,
      },
      create: {
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: dto.userAgent,
        recipientDirectoryUserId: recipient.recipientDirectoryUserId,
        recipientEmail: recipient.recipientEmail,
      },
    });
  }

  private async resolvePushRecipient(currentUser?: AuthenticatedUser) {
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
      recipientDirectoryUserId: directoryUser?.id ?? null,
      recipientEmail: currentUser.email ?? null,
    };
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
