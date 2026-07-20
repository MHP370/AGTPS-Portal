import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DirectoryController } from './directory.controller';
import { DirectorySyncService } from './directory-sync.service';
import { DirectoryService } from './directory.service';

@Module({
  imports: [PrismaModule],
  controllers: [DirectoryController],
  providers: [DirectoryService, DirectorySyncService],
})
export class DirectoryModule {}
