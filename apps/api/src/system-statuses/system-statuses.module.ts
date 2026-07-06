import { Module } from '@nestjs/common';
import { SystemStatusesController } from './system-statuses.controller';
import { SystemStatusesService } from './system-statuses.service';

@Module({
  controllers: [SystemStatusesController],
  providers: [SystemStatusesService],
})
export class SystemStatusesModule {}
