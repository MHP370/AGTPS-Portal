import { Injectable } from '@nestjs/common';
import { Client } from 'ldapts';
import { PrismaService } from '../prisma/prisma.service';

import { UpdateSettingsDto } from './dto/update-settings.dto';

const defaultSettings = {
  id: 1,
  companyName: 'AGTPS Portal',
  logo: null,
  primaryColor: '#22d3ee',
  portalBackgroundImageUrl: '/images/logo/apgt-logo.png',
  portalBackgroundOverlayColor: '#020617',
  portalBackgroundOverlayOpacity: 0.78,
  footerText: null,
  activeDirectoryEnabled: false,
  activeDirectoryUrl: null,
  activeDirectoryDomain: null,
  activeDirectoryBaseDn: null,
  activeDirectoryBindDn: null,
  activeDirectoryBindPassword: null,
  activeDirectoryUserSearchBase: null,
  activeDirectoryGroupSearchBase: null,
  activeDirectoryLastStatus: null,
  activeDirectoryLastError: null,
  activeDirectoryLastCheckedAt: null,
};

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async find() {
    const settings = await this.prisma.setting.upsert({
      where: {
        id: 1,
      },
      update: {},
      create: defaultSettings,
    });

    return this.maskSecretFields(settings);
  }

  async update(dto: UpdateSettingsDto) {
    const currentSettings = await this.prisma.setting.upsert({
      where: {
        id: 1,
      },
      update: {},
      create: defaultSettings,
    });
    const updateData = {
      ...dto,
      activeDirectoryBindPassword:
        dto.activeDirectoryBindPassword &&
        dto.activeDirectoryBindPassword !== '__KEEP_EXISTING__'
          ? dto.activeDirectoryBindPassword
          : currentSettings.activeDirectoryBindPassword,
    };
    const settings = await this.prisma.setting.upsert({
      where: {
        id: 1,
      },
      update: updateData,
      create: {
        id: 1,
        ...updateData,
      },
    });

    return this.maskSecretFields(settings);
  }

  async testActiveDirectoryConnection() {
    const settings = await this.prisma.setting.upsert({
      where: {
        id: 1,
      },
      update: {},
      create: defaultSettings,
    });

    if (!settings.activeDirectoryEnabled) {
      return this.updateActiveDirectoryStatus('disabled');
    }

    if (
      !settings.activeDirectoryUrl ||
      !settings.activeDirectoryBaseDn ||
      !settings.activeDirectoryBindDn ||
      !settings.activeDirectoryBindPassword
    ) {
      return this.updateActiveDirectoryStatus(
        'missing_config',
        'Active Directory URL, Base DN, Bind DN and Bind Password are required.',
      );
    }

    const client = new Client({
      url: settings.activeDirectoryUrl,
      timeout: 5000,
      connectTimeout: 5000,
    });

    try {
      await client.bind(
        settings.activeDirectoryBindDn,
        settings.activeDirectoryBindPassword,
      );
      await client.search(
        settings.activeDirectoryUserSearchBase ||
          settings.activeDirectoryBaseDn,
        {
          scope: 'sub',
          filter: '(objectClass=user)',
          sizeLimit: 1,
        },
      );

      return this.updateActiveDirectoryStatus('connected');
    } catch (error) {
      return this.updateActiveDirectoryStatus(
        'failed',
        error instanceof Error ? error.message : 'Connection failed.',
      );
    } finally {
      await client.unbind().catch(() => undefined);
    }
  }

  private async updateActiveDirectoryStatus(
    status: string,
    error?: string,
  ) {
    const settings = await this.prisma.setting.update({
      where: {
        id: 1,
      },
      data: {
        activeDirectoryLastStatus: status,
        activeDirectoryLastError: error ?? null,
        activeDirectoryLastCheckedAt: new Date(),
      },
    });

    return this.maskSecretFields(settings);
  }

  private maskSecretFields<T extends { activeDirectoryBindPassword?: string | null }>(
    settings: T,
  ) {
    return {
      ...settings,
      activeDirectoryBindPassword: settings.activeDirectoryBindPassword
        ? '__KEEP_EXISTING__'
        : null,
    };
  }
}
