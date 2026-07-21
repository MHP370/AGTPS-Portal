import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { DirectorySource } from '@prisma/client';
import { Attribute, Change, Client } from 'ldapts';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActiveDirectoryAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async authenticate(rawUsername: string, password: string) {
    const settings = await this.prisma.setting.findUnique({ where: { id: 1 } });
    if (
      !settings?.activeDirectoryEnabled ||
      !settings.activeDirectoryUrl ||
      !settings.activeDirectoryDomain
    ) {
      throw new UnauthorizedException('Active Directory login is unavailable.');
    }

    if (!settings.activeDirectoryUrl.toLowerCase().startsWith('ldaps://')) {
      throw new UnauthorizedException(
        'ورود دامنه فقط از طریق اتصال امن LDAPS امکان‌پذیر است.',
      );
    }

    const username = this.normalizeUsername(
      rawUsername,
      settings.activeDirectoryDomain,
    );
    const directoryUser = await this.prisma.directoryUser.findFirst({
      where: {
        username: { equals: username, mode: 'insensitive' },
        source: DirectorySource.ACTIVE_DIRECTORY,
        isActive: true,
      },
    });
    if (!directoryUser) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const client = new Client({
      url: settings.activeDirectoryUrl,
      timeout: 15_000,
      connectTimeout: 10_000,
      tlsOptions: {
        ca: settings.activeDirectoryCaCertificate || undefined,
        servername: settings.activeDirectoryTlsServerName || undefined,
      },
    });
    try {
      await client.bind(
        `${username}@${settings.activeDirectoryDomain}`,
        password,
      );
    } catch {
      throw new UnauthorizedException('Invalid username or password');
    } finally {
      await client.unbind().catch(() => undefined);
    }

    return this.provisionPortalUser(directoryUser, settings.activeDirectoryDomain);
  }

  async authenticateTrustedWindowsIdentity(rawIdentity: string) {
    const settings = await this.prisma.setting.findUnique({ where: { id: 1 } });
    if (
      !settings?.activeDirectoryEnabled ||
      !settings.windowsSsoEnabled ||
      !settings.activeDirectoryDomain
    ) {
      throw new UnauthorizedException('Windows automatic login is unavailable.');
    }

    const identity = rawIdentity.trim();
    const suppliedDomain = identity.includes('\\')
      ? identity.slice(0, identity.lastIndexOf('\\'))
      : identity.includes('@')
        ? identity.slice(identity.lastIndexOf('@') + 1)
        : null;
    if (
      suppliedDomain &&
      suppliedDomain.toLowerCase() !== settings.activeDirectoryDomain.toLowerCase()
    ) {
      throw new UnauthorizedException('The authenticated Windows domain is not allowed.');
    }

    const username = this.normalizeUsername(identity, settings.activeDirectoryDomain);
    const directoryUser = await this.prisma.directoryUser.findFirst({
      where: {
        username: { equals: username, mode: 'insensitive' },
        source: DirectorySource.ACTIVE_DIRECTORY,
        isActive: true,
      },
    });
    if (!directoryUser) {
      throw new UnauthorizedException(
        'حساب ویندوز در فهرست کاربران فعال اکتیو دایرکتوری پورتال موجود نیست.',
      );
    }

    const user = await this.provisionPortalUser(
      directoryUser,
      settings.activeDirectoryDomain,
    );
    return { user, directoryUser, domain: settings.activeDirectoryDomain };
  }

  async updateContact(distinguishedName: string | null, values: { email?: string; mobile?: string }) {
    const settings = await this.prisma.setting.findUnique({ where: { id: 1 } });
    if (!distinguishedName || !settings?.activeDirectoryUrl || !settings.activeDirectoryBindDn || !settings.activeDirectoryBindPassword) {
      throw new BadRequestException("تنظیمات نوشتن اطلاعات در اکتیو دایرکتوری کامل نیست.");
    }
    if (!settings.activeDirectoryUrl.toLowerCase().startsWith("ldaps://")) {
      throw new BadRequestException("ویرایش اطلاعات اکتیو دایرکتوری فقط از طریق LDAPS مجاز است.");
    }
    const client = new Client({
      url: settings.activeDirectoryUrl, timeout: 15_000, connectTimeout: 10_000,
      tlsOptions: { ca: settings.activeDirectoryCaCertificate || undefined, servername: settings.activeDirectoryTlsServerName || undefined },
    });
    try {
      await client.bind(settings.activeDirectoryBindDn, settings.activeDirectoryBindPassword);
      const changes: Change[] = [];
      if (values.email !== undefined) changes.push(new Change({ operation: "replace", modification: new Attribute({ type: "mail", values: values.email ? [values.email] : [] }) }));
      if (values.mobile !== undefined) changes.push(new Change({ operation: "replace", modification: new Attribute({ type: "mobile", values: values.mobile ? [values.mobile] : [] }) }));
      if (changes.length) await client.modify(distinguishedName, changes);
    } catch {
      throw new BadRequestException("ویرایش اطلاعات در اکتیو دایرکتوری انجام نشد؛ مجوز سرویس‌اکانت را بررسی کنید.");
    } finally {
      await client.unbind().catch(() => undefined);
    }
  }

  private normalizeUsername(value: string, _domain: string) {
    const trimmed = value.trim();
    const withoutDomainPrefix = trimmed.includes('\\')
      ? trimmed.slice(trimmed.lastIndexOf('\\') + 1)
      : trimmed;
    const username = withoutDomainPrefix.split('@', 1)[0]?.trim();
    if (!username) {
      throw new UnauthorizedException('Invalid username or password');
    }
    return username;
  }

  private async provisionPortalUser(
    directoryUser: {
      id: string;
      username: string;
      displayName: string;
      email: string | null;
      mobile: string | null;
      isActive: boolean;
      externalId: string | null;
    },
    domain: string,
  ) {
    const linked = await this.prisma.user.findUnique({
      where: { directoryUserId: directoryUser.id },
    });
    if (linked) {
      if (!linked.isActive) {
        throw new UnauthorizedException('Invalid username or password');
      }
      return linked;
    }

    const usernameConflict = await this.prisma.user.findUnique({
      where: { username: directoryUser.username },
    });
    const portalUsername = usernameConflict
      ? `${directoryUser.username}@${domain}`
      : directoryUser.username;

    const desiredEmail =
      directoryUser.email?.trim().toLowerCase() ||
      `${directoryUser.username}@${domain}`;
    const emailConflict = await this.prisma.user.findUnique({
      where: { email: desiredEmail },
    });
    const fallbackIdentity =
      directoryUser.externalId?.slice(0, 16) || directoryUser.id;
    const portalEmail = emailConflict
      ? `ad-${fallbackIdentity}@${domain}`
      : desiredEmail;
    const [firstName, ...lastNameParts] = directoryUser.displayName
      .trim()
      .split(/\s+/);

    return this.prisma.user.create({
      data: {
        username: portalUsername,
        email: portalEmail,
        mobile: directoryUser.mobile,
        password: await bcrypt.hash(randomBytes(48).toString('base64url'), 12),
        firstName: firstName || null,
        lastName: lastNameParts.join(' ') || null,
        isActive: true,
        allowEmailChange: false,
        allowPasswordChange: false,
        allowProfileEdit: true,
        directoryUserId: directoryUser.id,
      },
    });
  }
}
