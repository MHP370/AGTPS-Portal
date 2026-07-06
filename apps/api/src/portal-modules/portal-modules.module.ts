import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PortalModulesController } from './portal-modules.controller';
import { PortalModulesService } from './portal-modules.service';

@Module({
  imports: [PrismaModule],
  controllers: [PortalModulesController],
  providers: [PortalModulesService],
})
export class PortalModulesModule {}
