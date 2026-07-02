import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  find() {
    return this.prisma.setting.findUnique({
      where: {
        id: 1,
      },
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
