import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';
import {
  DirectCommunicationMode,
  DirectCommunicationSenderType,
  DirectCommunicationStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDirectConversationDto } from './dto/create-direct-conversation.dto';
import { CreateDirectManagerDto } from './dto/create-direct-manager.dto';
import { CreateDirectReplyDto } from './dto/create-direct-reply.dto';
import { CreateDirectUserConversationDto } from './dto/create-direct-user-conversation.dto';
import { CreateForbiddenWordDto } from './dto/create-forbidden-word.dto';
import { UpdateDirectConversationStatusDto } from './dto/update-direct-conversation-status.dto';
import { UpdateDirectManagerDto } from './dto/update-direct-manager.dto';
import { UpdateForbiddenWordDto } from './dto/update-forbidden-word.dto';

const managerInclude = {
  portalUser: {
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
  directoryUser: true,
} satisfies Prisma.DirectCommunicationManagerInclude;

const conversationSelect = {
  id: true,
  mode: true,
  category: true,
  priority: true,
  status: true,
  subject: true,
  tags: true,
  senderDisplayName: true,
  isReadByManager: true,
  lastMessageAt: true,
  createdAt: true,
  updatedAt: true,
  manager: {
    select: {
      id: true,
      title: true,
      department: true,
      isCeo: true,
      isActive: true,
    },
  },
  senderUser: {
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
  senderDirectoryUser: true,
  messages: {
    orderBy: {
      createdAt: 'desc',
    },
    take: 1,
    select: {
      id: true,
      senderType: true,
      encryptionVersion: true,
      createdAt: true,
    },
  },
  _count: {
    select: {
      messages: true,
    },
  },
} satisfies Prisma.DirectCommunicationConversationSelect;

const publicManagerSelect = {
  id: true,
  title: true,
  department: true,
  description: true,
  isCeo: true,
} satisfies Prisma.DirectCommunicationManagerSelect;

const messageEncryptionVersion = 'server-aes-256-gcm-v1';

const conversationDetailSelect = {
  ...conversationSelect,
  messages: {
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      senderType: true,
      senderUserId: true,
      senderDirectoryUserId: true,
      encryptedPayload: true,
      encryptionVersion: true,
      createdAt: true,
    },
  },
} satisfies Prisma.DirectCommunicationConversationSelect;

type CurrentUser = {
  id: string;
  username?: string;
  email?: string;
};

@Injectable()
export class DirectCommunicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  getMessagingConfig() {
    const enabled =
      process.env.DIRECT_COMMUNICATION_MESSAGING_ENABLED !== 'false';

    return {
      enabled,
      encryptionVersion: messageEncryptionVersion,
      reason: enabled
        ? null
        : 'ارسال پیام مستقیم با تنظیم DIRECT_COMMUNICATION_MESSAGING_ENABLED=false غیرفعال شده است.',
      securityNotes: [
        'payload پیام با AES-256-GCM سمت سرور رمزنگاری و در دیتابیس ذخیره می‌شود.',
        'برای محیط عملیاتی مقدار DIRECT_COMMUNICATION_ENCRYPTION_KEY را تنظیم کنید.',
        'Audit log هرگز متن پیام یا payload رمزنگاری‌شده را ثبت نمی‌کند.',
        'این نسخه رمزنگاری سمت سرور است؛ End-to-End واقعی باید در فاز امنیتی جدا پیاده‌سازی شود.',
      ],
    };
  }

  findConversations() {
    return this.prisma.directCommunicationConversation.findMany({
      select: conversationSelect,
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  findAvailableManagers() {
    return this.prisma.directCommunicationManager.findMany({
      where: {
        isActive: true,
      },
      select: publicManagerSelect,
      orderBy: [
        {
          isCeo: 'desc',
        },
        {
          department: 'asc',
        },
        {
          title: 'asc',
        },
      ],
    });
  }

  async findMyConversations(currentUser?: CurrentUser) {
    if (!currentUser?.id) {
      return [];
    }

    return this.prisma.directCommunicationConversation.findMany({
      where: {
        senderUserId: currentUser.id,
      },
      select: conversationSelect,
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findMyConversationDetail(id: string, currentUser?: CurrentUser) {
    const access = await this.getConversationAccess(id, currentUser);
    if (!access.allowed) {
      throw new BadRequestException('این مکالمه برای شما قابل مشاهده نیست.');
    }

    const conversation =
      await this.prisma.directCommunicationConversation.findUnique({
        where: {
          id,
        },
        select: conversationDetailSelect,
      });

    if (!conversation) {
      throw new BadRequestException('مکالمه پیدا نشد.');
    }

    return this.mapConversationDetail(conversation);
  }

  async getMyContext(currentUser?: CurrentUser) {
    const managerIds = await this.findManagerIdsForUser(currentUser);
    return { isManager: managerIds.length > 0 };
  }

  async findInboxConversations(currentUser?: CurrentUser) {
    if (!currentUser?.id) {
      return [];
    }

    const managerIds = await this.findManagerIdsForUser(currentUser);
    if (managerIds.length === 0) {
      return [];
    }

    return this.prisma.directCommunicationConversation.findMany({
      where: {
        managerId: {
          in: managerIds,
        },
      },
      select: conversationSelect,
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async createUserConversation(
    dto: CreateDirectUserConversationDto,
    currentUser?: CurrentUser,
  ) {
    if (!currentUser?.id) {
      throw new BadRequestException('برای ارسال پیام باید وارد شوید.');
    }

    return this.createConversation(
      {
        managerId: dto.managerId,
        mode: dto.mode,
        category: dto.category,
        priority: dto.priority,
        subject: dto.subject,
        tags: dto.tags,
        encryptedPayload: this.encryptMessage(dto.message),
        anonymousTokenHash:
          dto.mode === DirectCommunicationMode.ANONYMOUS
            ? `${currentUser.id}:${Date.now()}`
            : undefined,
      },
      currentUser,
    );
  }

  async createConversationReply(
    id: string,
    dto: CreateDirectReplyDto,
    currentUser?: CurrentUser,
  ) {
    this.ensureMessagingEnabled();

    const access = await this.getConversationAccess(id, currentUser);
    if (!access.allowed || !access.conversation) {
      throw new BadRequestException('این مکالمه برای شما قابل پاسخ نیست.');
    }

    if (
      access.conversation.status === DirectCommunicationStatus.ARCHIVED ||
      access.conversation.status === DirectCommunicationStatus.CLOSED
    ) {
      throw new BadRequestException('این مکالمه بسته یا آرشیو شده است.');
    }

    await this.ensureAllowedText([dto.message]);

    const senderType = access.isManager
      ? DirectCommunicationSenderType.MANAGER
      : DirectCommunicationSenderType.EMPLOYEE;

    await this.prisma.directCommunicationMessage.create({
      data: {
        conversationId: id,
        senderType,
        senderUserId: currentUser?.id,
        encryptedPayload: this.encryptMessage(dto.message),
        encryptionVersion: messageEncryptionVersion,
      },
    });

    await this.prisma.directCommunicationConversation.update({
      where: {
        id,
      },
      data: {
        status: DirectCommunicationStatus.OPEN,
        isReadByManager: senderType === DirectCommunicationSenderType.MANAGER,
        lastMessageAt: new Date(),
      },
    });

    if (senderType === DirectCommunicationSenderType.MANAGER) {
      await this.notifyConversationSender(access.conversation);
    } else {
      await this.notifyManagerById(
        access.conversation.managerId,
        access.conversation.subject,
      );
    }

    return this.findMyConversationDetail(id, currentUser);
  }

  async createConversation(
    dto: CreateDirectConversationDto,
    currentUser?: CurrentUser,
  ) {
    this.ensureMessagingEnabled();

    const manager = await this.prisma.directCommunicationManager.findFirst({
      where: {
        id: dto.managerId,
        isActive: true,
      },
      include: {
        directoryUser: true,
        portalUser: true,
      },
    });

    if (!manager) {
      throw new BadRequestException('مدیر انتخاب‌شده فعال یا معتبر نیست.');
    }

    await this.ensureAllowedText([dto.subject, ...(dto.tags ?? [])]);

    const mode = dto.mode ?? DirectCommunicationMode.NORMAL;
    const isAnonymous = mode === DirectCommunicationMode.ANONYMOUS;

    const conversation =
      await this.prisma.directCommunicationConversation.create({
        data: {
          managerId: dto.managerId,
          mode,
          category: dto.category,
          priority: dto.priority,
          subject: dto.subject.trim(),
          tags: this.normalizeTags(dto.tags),
          anonymousTokenHash: isAnonymous
            ? dto.anonymousTokenHash?.trim() || null
            : null,
          senderUserId: isAnonymous ? null : currentUser?.id,
          senderDisplayName: isAnonymous
            ? null
            : currentUser?.username || currentUser?.email || null,
          lastMessageAt: new Date(),
          messages: {
            create: {
              senderType: DirectCommunicationSenderType.EMPLOYEE,
              senderUserId: isAnonymous ? null : currentUser?.id,
              encryptedPayload: dto.encryptedPayload.startsWith('aesgcm:v1:')
                ? dto.encryptedPayload
                : this.encryptMessage(dto.encryptedPayload),
              encryptionVersion: messageEncryptionVersion,
            },
          },
        },
        select: conversationSelect,
      });

    await this.notifyManagerAboutConversation(manager, conversation.subject);

    return conversation;
  }

  async updateConversationStatus(
    id: string,
    dto: UpdateDirectConversationStatusDto,
  ) {
    return this.prisma.directCommunicationConversation.update({
      where: {
        id,
      },
      data: {
        status: dto.status,
        isReadByManager:
          dto.status === DirectCommunicationStatus.OPEN ? undefined : true,
      },
      select: conversationSelect,
    });
  }

  async updateOwnInboxConversationStatus(
    id: string,
    dto: UpdateDirectConversationStatusDto,
    currentUser?: CurrentUser,
  ) {
    const managerIds = await this.findManagerIdsForUser(currentUser);
    if (managerIds.length === 0) {
      throw new BadRequestException('شما مدیر دریافت‌کننده این مکالمه نیستید.');
    }

    const conversation =
      await this.prisma.directCommunicationConversation.findFirst({
        where: {
          id,
          managerId: {
            in: managerIds,
          },
        },
        select: {
          id: true,
        },
      });

    if (!conversation) {
      throw new BadRequestException('این مکالمه برای شما قابل مدیریت نیست.');
    }

    return this.updateConversationStatus(id, dto);
  }

  findManagers() {
    return this.prisma.directCommunicationManager.findMany({
      include: managerInclude,
      orderBy: [
        {
          isCeo: 'desc',
        },
        {
          department: 'asc',
        },
        {
          title: 'asc',
        },
      ],
    });
  }

  async createManager(dto: CreateDirectManagerDto) {
    await this.validateManagerDto(dto);

    return this.prisma.directCommunicationManager.create({
      data: this.normalizeManagerCreateDto(dto),
      include: managerInclude,
    });
  }

  async updateManager(id: string, dto: UpdateDirectManagerDto) {
    await this.validateManagerDto(dto, id);

    return this.prisma.directCommunicationManager.update({
      where: {
        id,
      },
      data: this.normalizeManagerDto(dto),
      include: managerInclude,
    });
  }

  removeManager(id: string) {
    return this.prisma.directCommunicationManager.delete({
      where: {
        id,
      },
    });
  }

  findForbiddenWords() {
    return this.prisma.directCommunicationForbiddenWord.findMany({
      orderBy: {
        word: 'asc',
      },
    });
  }

  createForbiddenWord(dto: CreateForbiddenWordDto) {
    return this.prisma.directCommunicationForbiddenWord.create({
      data: this.normalizeForbiddenWordCreateDto(dto),
    });
  }

  updateForbiddenWord(id: string, dto: UpdateForbiddenWordDto) {
    return this.prisma.directCommunicationForbiddenWord.update({
      where: {
        id,
      },
      data: this.normalizeForbiddenWordDto(dto),
    });
  }

  removeForbiddenWord(id: string) {
    return this.prisma.directCommunicationForbiddenWord.delete({
      where: {
        id,
      },
    });
  }

  private ensureMessagingEnabled() {
    if (!this.getMessagingConfig().enabled) {
      throw new BadRequestException(
        'ارسال پیام مستقیم فعلا غیرفعال است.',
      );
    }
  }

  private async ensureAllowedText(values: Array<string | undefined>) {
    const normalizedText = values
      .filter(Boolean)
      .map((value) => this.normalizePersianText(value ?? ''))
      .join(' ');

    if (!normalizedText) {
      return;
    }

    const words = await this.prisma.directCommunicationForbiddenWord.findMany({
      where: {
        isActive: true,
      },
      select: {
        word: true,
        normalizedWord: true,
      },
    });

    const matchedWord = words.find((word) =>
      normalizedText.includes(word.normalizedWord),
    );

    if (matchedWord) {
      throw new BadRequestException(
        `متن ارسالی شامل عبارت غیرمجاز «${matchedWord.word}» است.`,
      );
    }
  }

  private normalizeTags(tags?: string[]) {
    return (tags ?? [])
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 12);
  }

  private encryptMessage(message: string) {
    const normalizedMessage = message.trim();
    if (!normalizedMessage) {
      throw new BadRequestException('متن پیام الزامی است.');
    }

    const iv = randomBytes(12);
    const cipher = createCipheriv(
      'aes-256-gcm',
      this.getMessageEncryptionKey(),
      iv,
    );
    const encrypted = Buffer.concat([
      cipher.update(normalizedMessage, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return [
      'aesgcm',
      'v1',
      iv.toString('base64url'),
      tag.toString('base64url'),
      encrypted.toString('base64url'),
    ].join(':');
  }

  private decryptMessage(payload: string, encryptionVersion: string) {
    if (encryptionVersion === 'placeholder-v1') {
      return this.decodeLegacyPlaceholderPayload(payload);
    }

    if (encryptionVersion !== messageEncryptionVersion) {
      return null;
    }

    try {
      const [prefix, version, ivValue, tagValue, encryptedValue] =
        payload.split(':');

      if (prefix !== 'aesgcm' || version !== 'v1') {
        return null;
      }

      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.getMessageEncryptionKey(),
        Buffer.from(ivValue, 'base64url'),
      );
      decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));

      return Buffer.concat([
        decipher.update(Buffer.from(encryptedValue, 'base64url')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      return null;
    }
  }

  private decodeLegacyPlaceholderPayload(payload: string) {
    try {
      return Buffer.from(payload, 'base64').toString('utf8');
    } catch {
      return '';
    }
  }

  private getMessageEncryptionKey() {
    const secret =
      process.env.DIRECT_COMMUNICATION_ENCRYPTION_KEY ||
      process.env.JWT_SECRET ||
      'AGTPS_DIRECT_COMMUNICATION_DEVELOPMENT_KEY_CHANGE_ME';

    return createHash('sha256').update(secret).digest();
  }

  private mapConversationDetail(
    conversation: Prisma.DirectCommunicationConversationGetPayload<{
      select: typeof conversationDetailSelect;
    }>,
  ) {
    return {
      ...conversation,
      messages: conversation.messages.map((message) => ({
        id: message.id,
        senderType: message.senderType,
        senderUserId: message.senderUserId,
        senderDirectoryUserId: message.senderDirectoryUserId,
        encryptionVersion: message.encryptionVersion,
        createdAt: message.createdAt,
        body:
          this.decryptMessage(
            message.encryptedPayload,
            message.encryptionVersion,
          ),
      })),
    };
  }

  private async getConversationAccess(id: string, currentUser?: CurrentUser) {
    if (!currentUser?.id) {
      return {
        allowed: false,
        isManager: false,
        conversation: null,
      };
    }

    const conversation =
      await this.prisma.directCommunicationConversation.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          managerId: true,
          senderUserId: true,
          subject: true,
          status: true,
          mode: true,
        },
      });

    if (!conversation) {
      return {
        allowed: false,
        isManager: false,
        conversation: null,
      };
    }

    const managerIds = await this.findManagerIdsForUser(currentUser);
    const isManager = managerIds.includes(conversation.managerId);
    const isSender = conversation.senderUserId === currentUser.id;

    return {
      allowed: isManager || isSender,
      isManager,
      conversation,
    };
  }

  private async findManagerIdsForUser(currentUser?: CurrentUser) {
    if (!currentUser?.id) {
      return [];
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: currentUser.id,
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    const directoryUser = user
      ? await this.prisma.directoryUser.findFirst({
          where: {
            isActive: true,
            OR: [
              {
                username: user.username,
              },
              {
                email: user.email,
              },
            ],
          },
          select: {
            id: true,
          },
        })
      : null;

    const managers = await this.prisma.directCommunicationManager.findMany({
      where: {
        isActive: true,
        OR: [
          {
            portalUserId: currentUser.id,
          },
          ...(directoryUser
            ? [
                {
                  directoryUserId: directoryUser.id,
                },
              ]
            : []),
        ],
      },
      select: {
        id: true,
      },
    });

    return managers.map((manager) => manager.id);
  }

  private async notifyManagerAboutConversation(
    manager: Prisma.DirectCommunicationManagerGetPayload<{
      include: {
        directoryUser: true;
        portalUser: true;
      };
    }>,
    subject: string,
  ) {
    if (!manager.directoryUserId && !manager.portalUser?.email) {
      return;
    }

    await this.notificationsService.createPortalNotification({
      type: NotificationType.DIRECT_MESSAGE,
      title: 'پیام جدید ارتباط مستقیم',
      body: `پیام جدید برای ${manager.title}: ${subject}`,
      recipientDirectoryUserId: manager.directoryUserId,
      recipientEmail: manager.directoryUser?.email ?? manager.portalUser?.email,
    });
  }

  private async notifyManagerById(managerId: string, subject: string) {
    const manager = await this.prisma.directCommunicationManager.findUnique({
      where: {
        id: managerId,
      },
      include: {
        directoryUser: true,
        portalUser: true,
      },
    });

    if (!manager) {
      return;
    }

    await this.notifyManagerAboutConversation(manager, subject);
  }

  private async notifyConversationSender(
    conversation: {
      senderUserId: string | null;
      subject: string;
      mode: DirectCommunicationMode;
    },
  ) {
    if (!conversation.senderUserId) {
      return;
    }

    const sender = await this.prisma.user.findUnique({
      where: {
        id: conversation.senderUserId,
      },
      select: {
        email: true,
      },
    });

    if (!sender?.email) {
      return;
    }

    await this.notificationsService.createPortalNotification({
      type: NotificationType.DIRECT_MESSAGE,
      title: 'پاسخ جدید به پیام مستقیم',
      body: `برای پیام «${conversation.subject}» پاسخ جدید ثبت شد.`,
      recipientEmail: sender.email,
    });
  }

  private async validateManagerDto(
    dto: CreateDirectManagerDto | UpdateDirectManagerDto,
    currentId?: string,
  ) {
    if (dto.portalUserId && dto.directoryUserId) {
      throw new BadRequestException(
        'برای هر مدیر فقط یک کاربر داخلی یا یک کاربر دایرکتوری انتخاب کنید.',
      );
    }

    if (dto.isCeo) {
      const existingCeo =
        await this.prisma.directCommunicationManager.findFirst({
          where: {
            isCeo: true,
            ...(currentId ? { id: { not: currentId } } : {}),
          },
        });

      if (existingCeo) {
        throw new BadRequestException(
          'فقط یک حساب مدیرعامل می‌تواند تعریف شود.',
        );
      }
    }
  }

  private normalizeManagerDto(
    dto: CreateDirectManagerDto | UpdateDirectManagerDto,
  ) {
    return {
      title: dto.title?.trim(),
      department: dto.department?.trim() || null,
      description: dto.description?.trim() || null,
      isCeo: dto.isCeo,
      isActive: dto.isActive,
      portalUserId: dto.portalUserId || null,
      directoryUserId: dto.directoryUserId || null,
    };
  }

  private normalizeManagerCreateDto(dto: CreateDirectManagerDto) {
    return {
      title: dto.title.trim(),
      department: dto.department?.trim() || null,
      description: dto.description?.trim() || null,
      isCeo: dto.isCeo,
      isActive: dto.isActive,
      portalUserId: dto.portalUserId || null,
      directoryUserId: dto.directoryUserId || null,
    };
  }

  private normalizeForbiddenWordDto(
    dto: CreateForbiddenWordDto | UpdateForbiddenWordDto,
  ) {
    const word = dto.word?.trim();

    return {
      word,
      normalizedWord: word ? this.normalizePersianText(word) : undefined,
      description: dto.description?.trim() || null,
      isActive: dto.isActive,
    };
  }

  private normalizeForbiddenWordCreateDto(dto: CreateForbiddenWordDto) {
    const word = dto.word.trim();

    return {
      word,
      normalizedWord: this.normalizePersianText(word),
      description: dto.description?.trim() || null,
      isActive: dto.isActive,
    };
  }

  private normalizePersianText(value: string) {
    return value
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/\u200c/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLocaleLowerCase('fa-IR');
  }
}
