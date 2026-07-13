import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

import { CreateApplicationSiteDto } from './dto/create-application-site.dto';
import { UpdateApplicationSiteDto } from './dto/update-application-site.dto';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.application.findMany({
      include: {
        category: true,
        sites: {
          include: {
            site: true,
          },
        },
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

  async findPortalApplications() {
    return this.prisma.application.findMany({
      where: {
        isActive: true,
        status: 'ACTIVE',
        category: {
          isActive: true,
        },
      },
      include: {
        category: true,
        sites: {
          where: {
            isActive: true,
          },
          include: {
            site: true,
          },
        },
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

  async findOne(id: string) {
    const application = await this.prisma.application.findUnique({
      where: {
        id,
      },
      include: {
        category: true,
        sites: {
          include: {
            site: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    return application;
  }

  async create(dto: CreateApplicationDto) {
    return this.prisma.application.create({
      data: dto,
      include: {
        category: true,
        sites: {
          include: {
            site: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateApplicationDto) {
    await this.findOne(id);

    return this.prisma.application.update({
      where: {
        id,
      },
      data: dto,
      include: {
        category: true,
        sites: {
          include: {
            site: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.application.delete({
      where: {
        id,
      },
    });
  }

  async createSite(dto: CreateApplicationSiteDto) {
    const application = await this.prisma.application.findUnique({
      where: {
        id: dto.applicationId,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    const site = await this.prisma.site.findUnique({
      where: {
        id: dto.siteId,
      },
    });

    if (!site) {
      throw new NotFoundException('Site not found.');
    }

    const exists = await this.prisma.applicationSite.findFirst({
      where: {
        applicationId: dto.applicationId,
        siteId: dto.siteId,
      },
    });

    if (exists) {
      throw new BadRequestException(
        'Application already exists for this site.',
      );
    }

    return this.prisma.applicationSite.create({
      data: dto,
      include: {
        application: true,
        site: true,
      },
    });
  }

  async updateSite(id: string, dto: UpdateApplicationSiteDto) {
    return this.prisma.applicationSite.update({
      where: {
        id,
      },
      data: dto,
      include: {
        application: true,
        site: true,
      },
    });
  }

  async removeSite(id: string) {
    return this.prisma.applicationSite.delete({
      where: {
        id,
      },
    });
  }
}
