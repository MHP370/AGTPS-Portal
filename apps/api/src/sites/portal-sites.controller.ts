import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';

import { SitesService } from './sites.service';

@Controller('portal/sites')
export class PortalSitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Get()
  findActive() {
    return this.sitesService.findActive();
  }

  @Get('detect')
  detect(@Req() request: Request) {
    const forwardedFor = request.headers['x-forwarded-for'];
    const clientIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0]?.trim() || request.socket.remoteAddress;
    return this.sitesService.detectByIp(clientIp);
  }

  @Get('weather')
  getWeather() {
    return this.sitesService.getPortalWeather();
  }
}
