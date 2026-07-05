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
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateDownloadDto } from './dto/create-download.dto';
import { UpdateDownloadDto } from './dto/update-download.dto';
import { DownloadsService } from './downloads.service';

@Controller('downloads')
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  @Get()
  findAll() {
    return this.downloadsService.findAll();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('downloads.manage')
  findAllForAdmin() {
    return this.downloadsService.findAll(true);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('downloads.manage')
  create(@Body() dto: CreateDownloadDto) {
    return this.downloadsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('downloads.manage')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDownloadDto,
  ) {
    return this.downloadsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('downloads.manage')
  remove(@Param('id') id: string) {
    return this.downloadsService.remove(id);
  }
}
