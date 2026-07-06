import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TrainingsController } from './trainings.controller';
import { TrainingsService } from './trainings.service';

@Module({
  imports: [PrismaModule],
  controllers: [TrainingsController],
  providers: [TrainingsService],
})
export class TrainingsModule {}
