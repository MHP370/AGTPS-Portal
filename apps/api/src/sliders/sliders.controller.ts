import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import { SlidersService } from './sliders.service';

import { CreateSliderDto } from './dto/create-slider.dto';
import { UpdateSliderDto } from './dto/update-slider.dto';

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
  create(
    @Body() dto: CreateSliderDto,
  ) {
    return this.slidersService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSliderDto,
  ) {
    return this.slidersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.slidersService.remove(id);
  }
}
