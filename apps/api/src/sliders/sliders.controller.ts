import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { SlidersService } from './sliders.service';

import { CreateSliderDto } from './dto/create-slider.dto';
import { UpdateSliderDto } from './dto/update-slider.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('sliders')
export class SlidersController {
  constructor(
    private readonly slidersService: SlidersService,
  ) {}

  @Get()
  findAll() {
    return this.slidersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.slidersService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('sliders.manage')
  create(
    @Body() dto: CreateSliderDto,
  ) {
    return this.slidersService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('sliders.manage')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSliderDto,
  ) {
    return this.slidersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('sliders.manage')
  remove(@Param('id') id: string) {
    return this.slidersService.remove(id);
  }
}
