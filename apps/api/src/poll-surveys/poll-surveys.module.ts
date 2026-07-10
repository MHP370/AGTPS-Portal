import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PollSurveysController } from './poll-surveys.controller';
import { PollSurveysService } from './poll-surveys.service';

@Module({
  imports: [PrismaModule],
  controllers: [PollSurveysController],
  providers: [PollSurveysService],
})
export class PollSurveysModule {}
