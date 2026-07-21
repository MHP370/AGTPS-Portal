import { Controller, Get } from '@nestjs/common';

import { SitesService } from './sites.service';

@Controller('portal/sites')
export class PortalSitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Get()
  findActive() {
    return this.sitesService.findActive();
  }

  @Get('weather')
  getWeather() {
    return this.sitesService.getPortalWeather();
  }
}
