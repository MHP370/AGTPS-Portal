import { BadRequestException, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DirectorySource, Prisma } from '@prisma/client';
import { Client } from 'ldapts';
import { PrismaService } from '../prisma/prisma.service';

type AdEntry = Record<string, unknown>;

export interface DirectorySyncResult {
  users: { found: number; created: number; updated: number; deactivated: number };
  groups: { found: number; created: number; updated: number; deactivated: number };
  memberships: number;
  syncedAt: string;
}

@Injectable()
export class DirectorySyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DirectorySyncService.name);
  private timer?: NodeJS.Timeout;
  private scheduledSyncRunning = false;
  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.runScheduledSync(), 60_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async runScheduledSync() {
    if (this.scheduledSyncRunning) return;
    const settings = await this.prisma.setting.findUnique({ where: { id: 1 } });
    if (!settings?.activeDirectoryEnabled) return;
    const intervalMs = Math.max(settings.activeDirectorySyncIntervalMinutes, 5) * 60_000;
    const lastSync = settings.activeDirectoryLastSyncedAt?.getTime() ?? 0;
    if (Date.now() - lastSync < intervalMs) return;
    this.scheduledSyncRunning = true;
    try {
      await this.sync();
    } catch (error) {
      this.logger.error(
        'Scheduled Active Directory sync failed',
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.scheduledSyncRunning = false;
    }
  }

  async sync(): Promise<DirectorySyncResult> {
    const settings = await this.prisma.setting.findUnique({ where: { id: 1 } });
    if (
      !settings?.activeDirectoryEnabled ||
      !settings.activeDirectoryUrl ||
      !settings.activeDirectoryBaseDn ||
      !settings.activeDirectoryBindDn ||
      !settings.activeDirectoryBindPassword
    ) {
      throw new BadRequestException(
        'تنظیمات اکتیو دایرکتوری کامل یا فعال نیست.',
      );
    }

    const client = new Client({
      url: settings.activeDirectoryUrl,
      timeout: 30000,
      connectTimeout: 10000,
    });

    try {
      await client.bind(
        settings.activeDirectoryBindDn,
        settings.activeDirectoryBindPassword,
      );

      const [userResult, groupResult] = await Promise.all([
        client.search(
          settings.activeDirectoryUserSearchBase || settings.activeDirectoryBaseDn,
          {
            scope: 'sub',
            filter:
              '(&(objectCategory=person)(objectClass=user)(sAMAccountName=*)(!(objectClass=computer))(!(userAccountControl:1.2.840.113556.1.4.803:=2)))',
            attributes: [
              'objectGUID',
              'distinguishedName',
              'sAMAccountName',
              'displayName',
              'mail',
              'department',
              'title',
              'userAccountControl',
            ],
            paged: { pageSize: 500 },
          },
        ),
        client.search(
          settings.activeDirectoryGroupSearchBase || settings.activeDirectoryBaseDn,
          {
            scope: 'sub',
            filter: '(objectCategory=group)',
            attributes: [
              'objectGUID',
              'distinguishedName',
              'cn',
              'displayName',
              'description',
              'member',
            ],
            paged: { pageSize: 500 },
          },
        ),
      ]);

      return await this.persist(
        userResult.searchEntries as unknown as AdEntry[],
        groupResult.searchEntries as unknown as AdEntry[],
      );
    } finally {
      await client.unbind().catch(() => undefined);
    }
  }

  private async persist(users: AdEntry[], groups: AdEntry[]) {
    const syncedAt = new Date();
    const userExternalIds = new Set<string>();
    const groupExternalIds = new Set<string>();
    const userIdByDn = new Map<string, string>();
    const groupIdByExternalId = new Map<string, string>();
    let usersCreated = 0;
    let usersUpdated = 0;
    let groupsCreated = 0;
    let groupsUpdated = 0;

    for (const entry of users) {
      const externalId = this.guid(entry.objectGUID);
      const username = this.text(entry.sAMAccountName).trim();
      const distinguishedName = this.text(
        entry.distinguishedName || entry.dn,
      ).trim();
      if (!externalId || !username || !distinguishedName) continue;

      userExternalIds.add(externalId);
      const existing = await this.prisma.directoryUser.findFirst({
        where: {
          OR: [
            { externalId },
            { username, source: DirectorySource.ACTIVE_DIRECTORY },
          ],
        },
        select: { id: true },
      });
      const accountControl = Number(this.text(entry.userAccountControl) || '0');
      const data = {
        username,
        displayName: this.text(entry.displayName).trim() || username,
        email: this.optionalText(entry.mail),
        department: this.optionalText(entry.department),
        title: this.optionalText(entry.title),
        source: DirectorySource.ACTIVE_DIRECTORY,
        isActive: (accountControl & 2) === 0,
        externalId,
        distinguishedName,
        lastSyncedAt: syncedAt,
      } satisfies Prisma.DirectoryUserUncheckedCreateInput;

      const saved = existing
        ? await this.prisma.directoryUser.update({ where: { id: existing.id }, data })
        : await this.prisma.directoryUser.create({ data });
      existing ? usersUpdated++ : usersCreated++;
      userIdByDn.set(this.normalizeDn(distinguishedName), saved.id);
    }

    for (const entry of groups) {
      const externalId = this.guid(entry.objectGUID);
      const name = this.text(entry.cn).trim();
      const distinguishedName = this.text(
        entry.distinguishedName || entry.dn,
      ).trim();
      if (!externalId || !name || !distinguishedName) continue;

      groupExternalIds.add(externalId);
      const existing = await this.prisma.directoryGroup.findFirst({
        where: {
          OR: [
            { externalId },
            { name, source: DirectorySource.ACTIVE_DIRECTORY },
          ],
        },
        select: { id: true },
      });
      const data = {
        name,
        title: this.text(entry.displayName).trim() || name,
        description: this.optionalText(entry.description),
        source: DirectorySource.ACTIVE_DIRECTORY,
        isActive: true,
        externalId,
        distinguishedName,
        lastSyncedAt: syncedAt,
      } satisfies Prisma.DirectoryGroupUncheckedCreateInput;

      const saved = existing
        ? await this.prisma.directoryGroup.update({ where: { id: existing.id }, data })
        : await this.prisma.directoryGroup.create({ data });
      existing ? groupsUpdated++ : groupsCreated++;
      groupIdByExternalId.set(externalId, saved.id);
    }

    let memberships = 0;
    for (const entry of groups) {
      const externalId = this.guid(entry.objectGUID);
      const groupId = groupIdByExternalId.get(externalId);
      if (!groupId) continue;
      const userIds = this.values(entry.member)
        .map((dn) => userIdByDn.get(this.normalizeDn(dn)))
        .filter((id): id is string => Boolean(id));

      await this.prisma.directoryGroupMember.deleteMany({ where: { groupId } });
      if (userIds.length) {
        await this.prisma.directoryGroupMember.createMany({
          data: [...new Set(userIds)].map((userId) => ({ groupId, userId })),
          skipDuplicates: true,
        });
      }
      memberships += new Set(userIds).size;
    }

    const usersDeactivated = userExternalIds.size
      ? await this.prisma.directoryUser.updateMany({
          where: {
            source: DirectorySource.ACTIVE_DIRECTORY,
            externalId: { notIn: [...userExternalIds] },
          },
          data: { isActive: false },
        })
      : { count: 0 };
    const groupsDeactivated = groupExternalIds.size
      ? await this.prisma.directoryGroup.updateMany({
          where: {
            source: DirectorySource.ACTIVE_DIRECTORY,
            externalId: { notIn: [...groupExternalIds] },
          },
          data: { isActive: false },
        })
      : { count: 0 };

    await this.prisma.setting.update({
      where: { id: 1 },
      data: { activeDirectoryLastSyncedAt: syncedAt, activeDirectoryLastSyncError: null },
    });

    return {
      users: {
        found: userExternalIds.size,
        created: usersCreated,
        updated: usersUpdated,
        deactivated: usersDeactivated.count,
      },
      groups: {
        found: groupExternalIds.size,
        created: groupsCreated,
        updated: groupsUpdated,
        deactivated: groupsDeactivated.count,
      },
      memberships,
      syncedAt: syncedAt.toISOString(),
    };
  }

  private text(value: unknown): string {
    if (Array.isArray(value)) return this.text(value[0]);
    if (Buffer.isBuffer(value)) return value.toString('utf8');
    return typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : '';
  }

  private optionalText(value: unknown) {
    const text = this.text(value).trim();
    return text || null;
  }

  private values(value: unknown): string[] {
    if (Array.isArray(value)) return value.map((item) => this.text(item)).filter(Boolean);
    const text = this.text(value);
    return text ? [text] : [];
  }

  private guid(value: unknown): string {
    const raw = Array.isArray(value) ? value[0] : value;
    if (Buffer.isBuffer(raw)) return raw.toString('hex');
    if (raw instanceof Uint8Array) return Buffer.from(raw).toString('hex');
    return this.text(raw).trim();
  }

  private normalizeDn(value: string) {
    return value.trim().toLowerCase();
  }
}
