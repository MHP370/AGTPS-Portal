import { Controller, Get } from '@nestjs/common';

import { SitesService } from './sites.service';
import { ApiResponse } from '../common/response/api-response';

@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Get()
  async findAll() {
    const data = await this.sitesService.findAll();

    return new ApiResponse(
      true,
      'Sites loaded successfully',
      data,
    );
  }
}
