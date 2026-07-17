import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type AuditActor = {
  id?: string | null;
  username?: string | null;
  email?: string | null;
};

export type AuditRequestMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.auditLog.findMany({
      include: {
        actor: {
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
      take: 300,
    });
  }

  async record(data: {
    actor?: AuditActor | null;
    request?: AuditRequestMeta | null;
    action: AuditAction;
    entityType: string;
    entityId?: string | null;
    summary?: string | null;
    metadata?: Record<string, unknown> | null;
  }) {
    return this.prisma.auditLog.create({
      data: {
        actorUserId: data.actor?.id ?? null,
        actorUsername: data.actor?.username ?? null,
        actorEmail: data.actor?.email ?? null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId ?? null,
        summary: data.summary ?? null,
        metadata: (data.metadata ?? undefined) as Prisma.InputJsonValue,
        ipAddress: data.request?.ipAddress ?? null,
        userAgent: data.request?.userAgent ?? null,
      },
    });
  }
}
