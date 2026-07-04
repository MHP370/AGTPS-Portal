import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ApplicationsController } from './applications.controller';
import { PortalApplicationsController } from './portal-applications.controller';
import { ApplicationsService } from './applications.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    ApplicationsController,
    PortalApplicationsController,
  ],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
