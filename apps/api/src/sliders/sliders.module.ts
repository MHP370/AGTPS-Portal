import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { SlidersController } from './sliders.controller';
import { SlidersService } from './sliders.service';

@Module({
  imports: [PrismaModule],
  controllers: [SlidersController],
  providers: [SlidersService],
})
export class SlidersModule {}
