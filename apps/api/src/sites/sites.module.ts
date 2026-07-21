import { Module } from '@nestjs/common';

import { SitesController } from './sites.controller';
import { PortalSitesController } from './portal-sites.controller';
import { SitesService } from './sites.service';

@Module({
  controllers: [SitesController, PortalSitesController],
  providers: [SitesService],
})
export class SitesModule {}
