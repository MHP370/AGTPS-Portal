import {
  Body,
  Controller,
  Get,
  Put,
} from '@nestjs/common';

import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
  ) {}

  @Get()
  find() {
    return this.settingsService.find();
  }

  @Put()
  update(
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.settingsService.update(dto);
  }
}
