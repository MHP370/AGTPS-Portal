import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DirectCommunicationController } from './direct-communication.controller';
import { DirectCommunicationService } from './direct-communication.service';

@Module({
  imports: [PrismaModule, AuditLogsModule, NotificationsModule],
  controllers: [DirectCommunicationController],
  providers: [DirectCommunicationService],
})
export class DirectCommunicationModule {}
