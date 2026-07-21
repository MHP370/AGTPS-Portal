import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import {
  Prisma,
  SmbFileAuditAction,
  type SmbShare,
} from '@prisma/client';
import * as fs from 'fs';
import { createReadStream } from 'fs';
import { readdir, stat, unlink } from 'fs/promises';
import { randomUUID } from 'node:crypto';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFileShareDto } from './dto/create-file-share.dto';
import { UpdateFileShareDto } from './dto/update-file-share.dto';
import { testSmbConnection } from '../common/smb/smb-connection';
import {
  downloadSharedSmbFile,
  listKerberosSmbItems,
  listSharedSmbItems,
} from '../common/smb/kerberos-smb-client';
import { decryptSecret, encryptSecret } from '../common/security/secret-box';

interface RequestUser {
  id: string;
  username: string;
  email?: string | null;
  permissions?: string[];
}

interface ShareAccess {
  canRead: boolean;
  canDownload: boolean;
  canUpload: boolean;
  canDelete: boolean;
}

const defaultAccess: ShareAccess = {
  canRead: false,
  canDownload: false,
  canUpload: false,
  canDelete: false,
};

const contentTypes: Record<string, string> = {
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

@Injectable()
export class FileSharesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllAdmin() {
    const shares = await this.prisma.smbShare.findMany({
      include: {
        userAccesses: true,
        groupAccesses: true,
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          title: 'asc',
        },
      ],
    });
    return shares.map((share) => ({
      ...share,
      sharedPassword: share.sharedPassword ? '__KEEP_EXISTING__' : null,
    }));
  }

  async create(dto: CreateFileShareDto) {
    try {
      const share = await this.prisma.smbShare.create({
        data: this.toShareData({
          ...dto,
          sharedPassword: encryptSecret(dto.sharedPassword) ?? undefined,
        }, 'create') as any,
        include: {
          userAccesses: true,
          groupAccesses: true,
        },
      });
      return {
        ...share,
        sharedPassword: share.sharedPassword ? '__KEEP_EXISTING__' : null,
      };
    } catch (error) {
      this.handlePrismaWriteError(error);
    }
  }

  async update(id: string, dto: UpdateFileShareDto) {
    const existing = await this.prisma.smbShare.findUniqueOrThrow({
      where: {
        id,
      },
    });

    try {
      const share = await this.prisma.smbShare.update({
        where: {
          id,
        },
        data: this.toShareData({
          ...dto,
          sharedPassword:
            dto.sharedPassword === '__KEEP_EXISTING__' ||
            dto.sharedPassword === undefined
              ? existing.sharedPassword ?? undefined
              : encryptSecret(dto.sharedPassword) ?? undefined,
        }, 'update') as any,
        include: {
          userAccesses: true,
          groupAccesses: true,
        },
      });
      return {
        ...share,
        sharedPassword: share.sharedPassword ? '__KEEP_EXISTING__' : null,
      };
    } catch (error) {
      this.handlePrismaWriteError(error);
    }
  }

  async testConnection(id: string) {
    const share = await this.prisma.smbShare.findUniqueOrThrow({ where: { id } });
    if (share.authMode === 'SHARED_ACCOUNT') {
      if (!share.sharedUsername || !share.sharedPassword) {
        throw new BadRequestException('حساب سرویس مشترک فایل‌شیر کامل نیست.');
      }
      try {
        await listSharedSmbItems(
          share.uncPath || share.rootPath,
          share.sharedUsername,
          decryptSecret(share.sharedPassword),
          '',
        );
        const checkedAt = new Date();
        await this.prisma.smbShare.update({
          where: { id },
          data: {
            lastConnectionAt: checkedAt,
            lastConnectionStatus: 'READY',
            lastConnectionError: null,
          },
        });
        return {
          path: share.uncPath || share.rootPath,
          host: null,
          share: null,
          reachable: true,
          kerberosReady: false,
          checkedAt: checkedAt.toISOString(),
          message: 'Shared SMB credentials are ready.',
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Shared SMB login failed.';
        await this.prisma.smbShare.update({
          where: { id },
          data: {
            lastConnectionAt: new Date(),
            lastConnectionStatus: 'FAILED',
            lastConnectionError: message,
          },
        });
        throw new BadRequestException('اتصال با حساب مشترک SMB ناموفق بود.');
      }
    }
    const result = await testSmbConnection(share.uncPath || share.rootPath);
    await this.prisma.smbShare.update({
      where: { id },
      data: {
        lastConnectionAt: new Date(result.checkedAt),
        lastConnectionStatus: result.kerberosReady ? 'READY' : result.reachable ? 'NETWORK_REACHABLE' : 'FAILED',
        lastConnectionError: result.kerberosReady ? null : result.message,
      },
    });
    return result;
  }

  remove(id: string) {
    return this.prisma.smbShare.delete({
      where: {
        id,
      },
    });
  }

  findAudit() {
    return this.prisma.smbFileAudit.findMany({
      take: 200,
      include: {
        share: {
          select: {
            id: true,
            title: true,
            key: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAccessibleShares(user: RequestUser) {
    const shares = await this.prisma.smbShare.findMany({
      where: {
        isActive: true,
      },
      include: {
        userAccesses: true,
        groupAccesses: true,
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          title: 'asc',
        },
      ],
    });

    const accessByShareId = await this.resolveAccessForShares(user, shares);

    return shares
      .map((share) => ({
        id: share.id,
        key: share.key,
        title: share.title,
        description: share.description,
        icon: share.icon,
        color: share.color,
        allowDownload: share.allowDownload,
        allowUpload: share.allowUpload,
        allowDelete: share.allowDelete,
        access: accessByShareId.get(share.id) ?? defaultAccess,
      }))
      .filter((share) => share.access.canRead);
  }

  async listItems(user: RequestUser, shareId: string, relativePath = '') {
    const { share, access } = await this.getShareWithAccess(user, shareId);

    if (!access.canRead) {
      throw new ForbiddenException('You do not have access to this share.');
    }

    if (share.authMode === 'SHARED_ACCOUNT') {
      if (!share.sharedUsername || !share.sharedPassword) {
        throw new BadRequestException('حساب سرویس مشترک فایل‌شیر کامل نیست.');
      }
      const items = await listSharedSmbItems(
        share.uncPath || share.rootPath,
        share.sharedUsername,
        decryptSecret(share.sharedPassword),
        relativePath,
      );
      await this.audit(share.id, user.id, SmbFileAuditAction.LIST, relativePath);
      return {
        share: {
          id: share.id,
          title: share.title,
          key: share.key,
          allowDownload: share.allowDownload,
          allowUpload: share.allowUpload,
          allowDelete: share.allowDelete,
          access,
        },
        path: relativePath,
        items,
      };
    }

    if (share.authMode === 'KERBEROS') {
      try {
        const items = await listKerberosSmbItems(
          share.uncPath || share.rootPath,
          user.username,
          relativePath,
        );
        await this.audit(share.id, user.id, SmbFileAuditAction.LIST, relativePath);
        return {
          share: {
            id: share.id,
            title: share.title,
            key: share.key,
            allowDownload: true,
            allowUpload: true,
            allowDelete: true,
            access,
          },
          path: relativePath,
          items,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (
          message.includes('constrained delegation failed') ||
          message.includes("KDC can't fulfill requested option")
        ) {
          throw new ForbiddenException(
            'حساب‌های مدیریتی محافظت‌شده مانند Domain Admin قابل Kerberos Delegation نیستند. با یک کاربر عادی دامنه وارد شوید.',
          );
        }
        throw new ForbiddenException(
          'Active Directory denied access to this folder or the SMB server is unavailable.',
        );
      }
    }

    const directoryPath = this.resolveInsideShare(share, relativePath);
    const directoryStat = await stat(directoryPath).catch(() => null);

    if (!directoryStat?.isDirectory()) {
      throw new NotFoundException('Folder was not found.');
    }

    const entries = await readdir(directoryPath, {
      withFileTypes: true,
    });

    await this.audit(share.id, user.id, SmbFileAuditAction.LIST, relativePath);

    const items = await Promise.all(
      entries.map(async (entry) => {
        const itemRelativePath = path.posix.join(
          relativePath.split(path.sep).join('/'),
          entry.name,
        );
        const itemPath = this.resolveInsideShare(share, itemRelativePath);
        const itemStat = await stat(itemPath);

        return {
          name: entry.name,
          path: itemRelativePath,
          type: entry.isDirectory() ? 'folder' : 'file',
          size: entry.isDirectory() ? null : itemStat.size,
          modifiedAt: itemStat.mtime.toISOString(),
          extension: entry.isDirectory()
            ? null
            : path.extname(entry.name).toLowerCase(),
        };
      }),
    );

    return {
      share: {
        id: share.id,
        title: share.title,
        key: share.key,
        allowDownload: share.allowDownload,
        allowUpload: share.allowUpload,
        allowDelete: share.allowDelete,
        access,
      },
      path: relativePath,
      items: items.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name, 'fa');
      }),
    };
  }

  async streamFile(
    user: RequestUser,
    shareId: string,
    relativePath: string,
    disposition: 'inline' | 'attachment',
  ) {
    const { share, access } = await this.getShareWithAccess(user, shareId);

    if (!access.canRead || !access.canDownload || !share.allowDownload) {
      throw new ForbiddenException('Download is disabled for this file.');
    }

    if (share.authMode === 'SHARED_ACCOUNT') {
      if (!share.sharedUsername || !share.sharedPassword) {
        throw new BadRequestException('حساب سرویس مشترک فایل‌شیر کامل نیست.');
      }
      const temporaryPath = `/tmp/agtps-shared-${randomUUID()}`;
      await downloadSharedSmbFile(
        share.uncPath || share.rootPath,
        share.sharedUsername,
        decryptSecret(share.sharedPassword),
        relativePath,
        temporaryPath,
      );
      const fileStat = await stat(temporaryPath);
      const stream = createReadStream(temporaryPath);
      stream.once('close', () => void unlink(temporaryPath).catch(() => undefined));
      await this.audit(
        share.id,
        user.id,
        disposition === 'inline'
          ? SmbFileAuditAction.PREVIEW
          : SmbFileAuditAction.DOWNLOAD,
        relativePath,
      );
      const extension = path.extname(relativePath).toLowerCase();
      return {
        file: new StreamableFile(stream),
        filename: path.basename(relativePath),
        contentType: contentTypes[extension] ?? 'application/octet-stream',
        contentLength: fileStat.size,
      };
    }

    const filePath = this.resolveInsideShare(share, relativePath);
    const fileStat = await stat(filePath).catch(() => null);

    if (!fileStat?.isFile()) {
      throw new NotFoundException('File was not found.');
    }

    await this.audit(
      share.id,
      user.id,
      disposition === 'inline'
        ? SmbFileAuditAction.PREVIEW
        : SmbFileAuditAction.DOWNLOAD,
      relativePath,
    );

    const extension = path.extname(filePath).toLowerCase();

    return {
      file: new StreamableFile(createReadStream(filePath)),
      filename: path.basename(filePath),
      contentType: contentTypes[extension] ?? 'application/octet-stream',
      contentLength: fileStat.size,
    };
  }

  private toShareData(
    dto: Partial<CreateFileShareDto>,
    mode: 'create' | 'update',
  ) {
    const { userAccesses, groupAccesses, ...share } = dto;
    const usesWindowsAcl = share.authMode === 'KERBEROS';
    const hasExternalAcl =
      share.authMode === 'KERBEROS' || share.authMode === 'SHARED_ACCOUNT';
    const relationMode =
      mode === 'update'
        ? {
            deleteMany: {},
          }
        : {};

    return {
      ...share,
      allowDownload: usesWindowsAcl ? true : share.allowDownload,
      allowUpload: usesWindowsAcl ? true : share.allowUpload,
      allowDelete: usesWindowsAcl ? true : share.allowDelete,
      rootPath: share.rootPath?.trim(),
      userAccesses: hasExternalAcl
        ? mode === 'update'
          ? { deleteMany: {} }
          : undefined
        : userAccesses
        ? {
            ...relationMode,
            create: userAccesses.map((access) => ({
              directoryUserId: access.id,
              canRead: access.canRead ?? true,
              canDownload: access.canDownload ?? true,
              canUpload: access.canUpload ?? false,
              canDelete: access.canDelete ?? false,
            })),
          }
        : undefined,
      groupAccesses: hasExternalAcl
        ? mode === 'update'
          ? { deleteMany: {} }
          : undefined
        : groupAccesses
        ? {
            ...relationMode,
            create: groupAccesses.map((access) => ({
              directoryGroupId: access.id,
              canRead: access.canRead ?? true,
              canDownload: access.canDownload ?? true,
              canUpload: access.canUpload ?? false,
              canDelete: access.canDelete ?? false,
            })),
          }
        : undefined,
    };
  }

  private handlePrismaWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new BadRequestException('A file share with this key already exists.');
      }

      if (error.code === 'P2003') {
        throw new BadRequestException(
          'One of the selected users or groups is not valid.',
        );
      }
    }

    throw error;
  }

  private async getShareWithAccess(user: RequestUser, shareId: string) {
    const share = await this.prisma.smbShare.findFirst({
      where: {
        id: shareId,
        isActive: true,
      },
      include: {
        userAccesses: true,
        groupAccesses: true,
      },
    });

    if (!share) {
      throw new NotFoundException('Share was not found.');
    }

    const accessByShareId = await this.resolveAccessForShares(user, [share]);

    return {
      share,
      access: accessByShareId.get(share.id) ?? defaultAccess,
    };
  }

  private async resolveAccessForShares(
    user: RequestUser,
    shares: Array<
      SmbShare & {
        userAccesses: Array<{
          directoryUserId: string;
          canRead: boolean;
          canDownload: boolean;
          canUpload: boolean;
          canDelete: boolean;
        }>;
        groupAccesses: Array<{
          directoryGroupId: string;
          canRead: boolean;
          canDownload: boolean;
          canUpload: boolean;
          canDelete: boolean;
        }>;
      }
    >,
  ) {
    const accessByShareId = new Map<string, ShareAccess>();

    shares
      .filter((share) => share.authMode === 'SHARED_ACCOUNT')
      .forEach((share) =>
        accessByShareId.set(share.id, {
          canRead: true,
          canDownload: share.allowDownload,
          canUpload: share.allowUpload,
          canDelete: share.allowDelete,
        }),
      );

    if (user.permissions?.includes('file-shares.manage')) {
      shares.forEach((share) => {
        accessByShareId.set(share.id, {
          canRead: true,
          canDownload: true,
          canUpload: share.allowUpload,
          canDelete: share.allowDelete,
        });
      });
      return accessByShareId;
    }

    const directoryUser = await this.prisma.directoryUser.findFirst({
      where: {
        isActive: true,
        OR: [
          {
            username: user.username,
          },
          {
            email: user.email ?? undefined,
          },
        ],
      },
      include: {
        groupMemberships: true,
      },
    });

    if (!directoryUser) {
      return accessByShareId;
    }

    const groupIds = new Set(
      directoryUser.groupMemberships.map((membership) => membership.groupId),
    );

    shares.forEach((share) => {
      if (share.authMode === 'SHARED_ACCOUNT') return;
      if (share.authMode === 'KERBEROS') {
        accessByShareId.set(share.id, {
          canRead: true,
          canDownload: true,
          canUpload: true,
          canDelete: true,
        });
        return;
      }

      const access = { ...defaultAccess };

      share.userAccesses
        .filter((item) => item.directoryUserId === directoryUser.id)
        .forEach((item) => this.mergeAccess(access, item));

      share.groupAccesses
        .filter((item) => groupIds.has(item.directoryGroupId))
        .forEach((item) => this.mergeAccess(access, item));

      accessByShareId.set(share.id, access);
    });

    return accessByShareId;
  }

  private mergeAccess(
    target: ShareAccess,
    source: ShareAccess,
  ) {
    target.canRead ||= source.canRead;
    target.canDownload ||= source.canDownload;
    target.canUpload ||= source.canUpload;
    target.canDelete ||= source.canDelete;
  }

  private resolveInsideShare(share: SmbShare, relativePath: string) {
    if (relativePath.includes('\0')) {
      throw new BadRequestException('Invalid path.');
    }

    const root = path.resolve(share.rootPath);
    const requested = path.resolve(root, relativePath || '.');
    const isInside = requested === root || requested.startsWith(`${root}${path.sep}`);

    if (!isInside) {
      throw new ForbiddenException('Path is outside of the configured share.');
    }

    if (!fs.existsSync(root)) {
      throw new NotFoundException('Share root path is not available on server.');
    }

    return requested;
  }

  private audit(
    shareId: string,
    userId: string | undefined,
    action: SmbFileAuditAction,
    relativePath: string,
    detail?: string,
  ) {
    return this.prisma.smbFileAudit.create({
      data: {
        shareId,
        userId,
        action,
        path: relativePath || '/',
        detail,
      },
    });
  }
}
