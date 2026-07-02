import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findAll() {
    return this.prisma.permission.findMany({
      orderBy: {
        title: 'asc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.permission.findUnique({
      where: {
        id,
      },
    });
  }

  create(dto: CreatePermissionDto) {
    return this.prisma.permission.create({
      data: dto,
    });
  }

  update(
    id: string,
    dto: UpdatePermissionDto,
  ) {
    return this.prisma.permission.update({
      where: {
        id,
      },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.permission.delete({
      where: {
        id,
      },
    });
  }
}
