import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePortalModuleDto } from './dto/update-portal-module.dto';

@Injectable()
export class PortalModulesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includeDisabled = true) {
    return this.prisma.portalModule.findMany({
      where: includeDisabled
        ? undefined
        : {
            isInstalled: true,
            isEnabled: true,
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
  }

  findEnabled() {
    return this.findAll(false);
  }

  async update(key: string, dto: UpdatePortalModuleDto) {
    const current = await this.prisma.portalModule.findUnique({
      where: {
        key,
      },
    });

    if (!current) {
      throw new NotFoundException('Module was not found.');
    }

    if (
      current.isCore &&
      (dto.isEnabled === false || dto.isInstalled === false)
    ) {
      throw new BadRequestException('Core modules cannot be disabled.');
    }

    return this.prisma.portalModule.update({
      where: {
        key,
      },
      data: dto,
    });
  }
}
