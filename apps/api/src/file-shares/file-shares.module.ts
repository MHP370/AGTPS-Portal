import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FileSharesController } from './file-shares.controller';
import { FileSharesService } from './file-shares.service';

@Module({
  imports: [PrismaModule],
  controllers: [FileSharesController],
  providers: [FileSharesService],
})
export class FileSharesModule {}
