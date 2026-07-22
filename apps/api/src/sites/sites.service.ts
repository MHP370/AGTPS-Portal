import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';

@Injectable()
export class SitesService {
  private weatherCache?: { expiresAt: number; value: unknown[] };

  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.site.findMany({
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });
  }

  findActive() {
    return this.prisma.site.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });
  }

  async detectByIp(rawIp?: string) {
    const clientIp = this.normalizeIpv4(rawIp);
    if (!clientIp) return { site: null };

    const sites = await this.findActive();
    const matches = sites.flatMap((site) =>
      (site.ipRange || '')
        .split(/[\n,;]+/)
        .map((cidr) => cidr.trim())
        .filter(Boolean)
        .map((cidr) => ({ site, prefix: this.matchCidr(clientIp, cidr) }))
        .filter((match) => match.prefix !== null),
    );
    matches.sort((first, second) => second.prefix! - first.prefix!);
    return { site: matches[0]?.site || null };
  }

  private normalizeIpv4(rawIp?: string) {
    const value = rawIp?.trim().replace(/^::ffff:/, '');
    if (!value) return null;
    const parts = value.split('.');
    if (
      parts.length !== 4 ||
      parts.some(
        (part) =>
          !/^\d{1,3}$/.test(part) || Number(part) < 0 || Number(part) > 255,
      )
    ) {
      return null;
    }
    return parts.map(Number);
  }

  private matchCidr(ip: number[], cidr: string) {
    const [networkValue, prefixValue = '32'] = cidr.split('/');
    const network = this.normalizeIpv4(networkValue);
    const prefix = Number(prefixValue);
    if (!network || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
      return null;
    }
    const ipNumber = ip.reduce((value, part) => (value * 256 + part) >>> 0, 0);
    const networkNumber = network.reduce(
      (value, part) => (value * 256 + part) >>> 0,
      0,
    );
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    return (ipNumber & mask) === (networkNumber & mask) ? prefix : null;
  }

  async getPortalWeather() {
    if (this.weatherCache && this.weatherCache.expiresAt > Date.now()) {
      return this.weatherCache.value;
    }

    const sites = await this.findActive();
    const value = await Promise.all(
      sites.map(async (site) => {
        const coordinates = await this.resolveWeatherCoordinates(site);
        if (!coordinates) {
          return {
            siteId: site.id,
            siteName: site.name,
            available: false,
            reason: 'missing_coordinates',
          };
        }

        try {
          const params = new URLSearchParams({
            latitude: String(coordinates.latitude),
            longitude: String(coordinates.longitude),
            current:
              'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
            timezone: 'Asia/Tehran',
          });
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?${params}`,
            { signal: AbortSignal.timeout(8000) },
          );
          if (!response.ok) throw new Error(`Weather API ${response.status}`);
          const payload = (await response.json()) as {
            current?: Record<string, number | string>;
          };
          const current = payload.current;
          if (!current) throw new Error('Weather data is missing');

          return {
            siteId: site.id,
            siteName: site.name,
            available: true,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            observedAt: current.time,
            temperature: current.temperature_2m,
            apparentTemperature: current.apparent_temperature,
            humidity: current.relative_humidity_2m,
            precipitation: current.precipitation,
            windSpeed: current.wind_speed_10m,
            weatherCode: current.weather_code,
            isDay: current.is_day === 1,
          };
        } catch {
          return {
            siteId: site.id,
            siteName: site.name,
            available: false,
            reason: 'provider_unavailable',
          };
        }
      }),
    );

    this.weatherCache = { expiresAt: Date.now() + 10 * 60 * 1000, value };
    return value;
  }

  private async resolveWeatherCoordinates(site: {
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  }) {
    if (site.latitude !== null && site.longitude !== null) {
      return { latitude: site.latitude, longitude: site.longitude };
    }

    for (const query of [site.name, site.address].filter(Boolean) as string[]) {
      try {
        const params = new URLSearchParams({
          name: query,
          count: '1',
          language: 'fa',
          format: 'json',
        });
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?${params}`,
          { signal: AbortSignal.timeout(5000) },
        );
        if (!response.ok) continue;
        const payload = (await response.json()) as {
          results?: Array<{ latitude: number; longitude: number }>;
        };
        const result = payload.results?.[0];
        if (result) return result;
      } catch {}
    }

    return null;
  }

  findOne(id: string) {
    return this.prisma.site.findUnique({
      where: {
        id,
      },
    });
  }

  create(dto: CreateSiteDto) {
    this.weatherCache = undefined;
    return this.prisma.site.create({
      data: dto,
    });
  }

  update(
    id: string,
    dto: UpdateSiteDto,
  ) {
    this.weatherCache = undefined;
    return this.prisma.site.update({
      where: {
        id,
      },
      data: dto,
    });
  }

  remove(id: string) {
    this.weatherCache = undefined;
    return this.prisma.site.delete({
      where: {
        id,
      },
    });
  }
}
