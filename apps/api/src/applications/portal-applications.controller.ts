import { Controller, Get } from '@nestjs/common';

import { ApplicationsService } from './applications.service';

@Controller('portal/applications')
export class PortalApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
  ) {}

  @Get()
  findAll() {
    return this.applicationsService.findPortalApplications();
  }
}
