import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BackupsController } from './backups.controller';
import { BackupsService } from './backups.service';

@Module({
  imports: [PrismaModule, NotificationsModule, AuditLogsModule],
  controllers: [BackupsController],
  providers: [BackupsService],
})
export class BackupsModule {}
