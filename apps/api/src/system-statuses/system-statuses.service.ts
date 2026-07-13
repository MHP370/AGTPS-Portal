import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { SystemHealthCheckType, SystemHealthState } from '@prisma/client';
import { Socket } from 'node:net';
import { performance } from 'node:perf_hooks';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSystemStatusDto } from './dto/create-system-status.dto';
import { UpdateSystemStatusDto } from './dto/update-system-status.dto';

const execFileAsync = promisify(execFile);

@Injectable()
export class SystemStatusesService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(SystemStatusesService.name);
  private scheduler?: NodeJS.Timeout;
  private isChecking = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.scheduler = setInterval(() => {
      void this.checkDueSystems();
    }, 30_000);

    void this.checkDueSystems();
  }

  onModuleDestroy() {
    if (this.scheduler) {
      clearInterval(this.scheduler);
    }
  }

  findAll(includeInactive = false) {
    return this.prisma.systemStatus.findMany({
      where: includeInactive
        ? undefined
        : {
            isActive: true,
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

  findOne(id: string) {
    return this.prisma.systemStatus.findUnique({
      where: {
        id,
      },
    });
  }

  create(dto: CreateSystemStatusDto) {
    return this.prisma.systemStatus.create({
      data: this.normalizeCreateDto(dto),
    });
  }

  update(id: string, dto: UpdateSystemStatusDto) {
    return this.prisma.systemStatus.update({
      where: {
        id,
      },
      data: this.normalizeUpdateDto(dto),
    });
  }

  remove(id: string) {
    return this.prisma.systemStatus.delete({
      where: {
        id,
      },
    });
  }

  async checkNow(id: string) {
    const system = await this.findOne(id);

    if (!system) {
      throw new NotFoundException('System status not found.');
    }

    return this.runHealthCheck(system.id);
  }

  private normalizeCreateDto(dto: CreateSystemStatusDto) {
    const normalized = this.normalizeDto(dto);

    return {
      ...normalized,
      title: dto.title,
      status: dto.status?.trim() || 'نامشخص',
    };
  }

  private normalizeUpdateDto(dto: UpdateSystemStatusDto) {
    return this.normalizeDto(dto);
  }

  private normalizeDto(dto: CreateSystemStatusDto | UpdateSystemStatusDto) {
    const checkType = dto.checkType ?? undefined;
    const normalized = {
      ...dto,
      method: dto.method?.trim().toUpperCase(),
      target: dto.target?.trim() || undefined,
      expectedStatusCodes:
        dto.expectedStatusCodes?.trim() || undefined,
      expectedKeyword:
        dto.expectedKeyword?.trim() || undefined,
    };

    if (
      checkType &&
      checkType !== SystemHealthCheckType.MANUAL &&
      !normalized.target
    ) {
      throw new BadRequestException(
        'Target is required for automatic health checks.',
      );
    }

    return normalized;
  }

  private async checkDueSystems() {
    if (this.isChecking) return;

    this.isChecking = true;

    try {
      const now = new Date();
      const systems = await this.prisma.systemStatus.findMany({
        where: {
          isActive: true,
          checkType: {
            not: SystemHealthCheckType.MANUAL,
          },
          OR: [
            {
              nextCheckAt: null,
            },
            {
              nextCheckAt: {
                lte: now,
              },
            },
          ],
        },
        orderBy: {
          nextCheckAt: 'asc',
        },
        take: 10,
      });

      for (const system of systems) {
        await this.runHealthCheck(system.id);
      }
    } catch (error) {
      this.logger.warn(
        error instanceof Error
          ? error.message
          : 'System health scheduler failed.',
      );
    } finally {
      this.isChecking = false;
    }
  }

  private async runHealthCheck(id: string) {
    const system = await this.prisma.systemStatus.findUnique({
      where: {
        id,
      },
    });

    if (!system) {
      throw new NotFoundException('System status not found.');
    }

    if (system.checkType === SystemHealthCheckType.MANUAL) {
      return system;
    }

    const startedAt = performance.now();
    let state: SystemHealthState = SystemHealthState.UNKNOWN;
    let errorMessage: string | null = null;

    try {
      if (system.checkType === SystemHealthCheckType.HTTP) {
        state = await this.checkHttp(system);
      } else if (system.checkType === SystemHealthCheckType.PING) {
        state = await this.checkPing(system);
      } else {
        state = await this.checkTcp(system);
      }
    } catch (error) {
      state = SystemHealthState.DOWN;
      errorMessage =
        error instanceof Error
          ? error.message
          : 'Health check failed.';
    }

    const responseTimeMs = Math.max(
      0,
      Math.round(performance.now() - startedAt),
    );
    const checkedAt = new Date();
    const nextCheckAt = new Date(
      checkedAt.getTime() +
        Math.max(system.intervalSeconds, 30) * 1000,
    );

    return this.prisma.systemStatus.update({
      where: {
        id: system.id,
      },
      data: {
        status: this.getStatusLabel(state),
        lastHealthState: state,
        lastCheckedAt: checkedAt,
        lastResponseTimeMs: responseTimeMs,
        lastError: errorMessage,
        nextCheckAt,
      },
    });
  }

  private async checkHttp(system: {
    target: string | null;
    method: string;
    timeoutMs: number;
    expectedStatusCodes: string;
    expectedKeyword: string | null;
  }) {
    if (!system.target) {
      throw new BadRequestException('HTTP target is required.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      system.timeoutMs,
    );

    try {
      const response = await fetch(system.target, {
        method: system.method || 'GET',
        signal: controller.signal,
      });
      const statusOk = this.statusCodeMatches(
        response.status,
        system.expectedStatusCodes,
      );

      if (!statusOk) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (system.expectedKeyword) {
        const body = await response.text();

        if (!body.includes(system.expectedKeyword)) {
          return SystemHealthState.DEGRADED;
        }
      }

      return SystemHealthState.UP;
    } finally {
      clearTimeout(timeout);
    }
  }

  private checkTcp(system: {
    checkType: SystemHealthCheckType;
    target: string | null;
    timeoutMs: number;
  }) {
    const endpoint = this.parseTcpEndpoint(
      system.target,
      system.checkType === SystemHealthCheckType.SMB ? 445 : undefined,
    );

    return new Promise<SystemHealthState>((resolve, reject) => {
      const socket = new Socket();
      let settled = false;

      function finish(
        state: SystemHealthState,
        error?: Error,
      ) {
        if (settled) return;
        settled = true;
        socket.destroy();

        if (error) {
          reject(error);
          return;
        }

        resolve(state);
      }

      socket.setTimeout(system.timeoutMs);
      socket.once('connect', () => finish(SystemHealthState.UP));
      socket.once('timeout', () =>
        finish(
          SystemHealthState.DOWN,
          new Error('Connection timeout.'),
        ),
      );
      socket.once('error', (error) =>
        finish(SystemHealthState.DOWN, error),
      );
      socket.connect(endpoint.port, endpoint.host);
    });
  }

  private async checkPing(system: {
    target: string | null;
    timeoutMs: number;
  }) {
    if (!system.target) {
      throw new BadRequestException('Ping target is required.');
    }

    const host = this.parsePingTarget(system.target);
    const timeoutSeconds = Math.max(
      1,
      Math.ceil(system.timeoutMs / 1000),
    );

    await execFileAsync('ping', [
      '-c',
      '1',
      '-W',
      String(timeoutSeconds),
      host,
    ]);

    return SystemHealthState.UP;
  }

  private parsePingTarget(target: string) {
    if (target.startsWith('http://') || target.startsWith('https://')) {
      return new URL(target).hostname;
    }

    return target.split(':')[0];
  }

  private parseTcpEndpoint(target: string | null, defaultPort?: number) {
    if (!target) {
      throw new BadRequestException('TCP target is required.');
    }

    if (target.startsWith('http://') || target.startsWith('https://')) {
      const url = new URL(target);
      const port =
        Number(url.port) ||
        defaultPort ||
        (url.protocol === 'https:' ? 443 : 80);

      return {
        host: url.hostname,
        port,
      };
    }

    const [host, portText] = target.split(':');
    const port = Number(portText ?? defaultPort);

    if (!host || !Number.isInteger(port) || port <= 0) {
      throw new BadRequestException(
        'Target must be host:port for TCP checks.',
      );
    }

    return {
      host,
      port,
    };
  }

  private statusCodeMatches(status: number, expression: string) {
    return expression
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .some((item) => {
        if (item.includes('-')) {
          const [from, to] = item
            .split('-')
            .map((part) => Number(part.trim()));

          return status >= from && status <= to;
        }

        return status === Number(item);
      });
  }

  private getStatusLabel(state: SystemHealthState) {
    const labels: Record<SystemHealthState, string> = {
      [SystemHealthState.UP]: 'در دسترس',
      [SystemHealthState.DEGRADED]: 'اختلال',
      [SystemHealthState.DOWN]: 'قطع',
      [SystemHealthState.UNKNOWN]: 'نامشخص',
    };

    return labels[state];
  }
}
