import { Injectable } from '@nestjs/common';
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
};

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  find() {
    return this.prisma.setting.upsert({
      where: {
        id: 1,
      },
      update: {},
      create: defaultSettings,
    });
  }

  update(dto: UpdateSettingsDto) {
    return this.prisma.setting.upsert({
      where: {
        id: 1,
      },
      update: dto,
      create: {
        id: 1,
        ...dto,
      },
    });
  }
}
