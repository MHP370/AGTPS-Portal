import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateFileShareDto } from './dto/create-file-share.dto';
import { UpdateFileShareDto } from './dto/update-file-share.dto';
import { FileSharesService } from './file-shares.service';

interface RequestUser {
  id: string;
  username: string;
  email?: string | null;
  permissions?: string[];
}

@Controller('file-shares')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FileSharesController {
  constructor(private readonly fileSharesService: FileSharesService) {}

  @Get('admin/all')
  @Permissions('file-shares.manage')
  findAllAdmin() {
    return this.fileSharesService.findAllAdmin();
  }

  @Post()
  @Permissions('file-shares.manage')
  create(@Body() dto: CreateFileShareDto) {
    return this.fileSharesService.create(dto);
  }

  @Put(':id')
  @Permissions('file-shares.manage')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFileShareDto,
  ) {
    return this.fileSharesService.update(id, dto);
  }

  @Post(':id/test')
  @Permissions('file-shares.manage')
  testConnection(@Param('id') id: string) {
    return this.fileSharesService.testConnection(id);
  }

  @Delete(':id')
  @Permissions('file-shares.manage')
  remove(@Param('id') id: string) {
    return this.fileSharesService.remove(id);
  }

  @Get('admin/audit')
  @Permissions('file-shares.manage')
  findAudit() {
    return this.fileSharesService.findAudit();
  }

  @Get()
  @Permissions('file-shares.view')
  findAccessible(
    @Req() request: { user: RequestUser },
  ): Promise<unknown> {
    return this.fileSharesService.findAccessibleShares(request.user);
  }

  @Get(':id/items')
  @Permissions('file-shares.view')
  listItems(
    @Req() request: { user: RequestUser },
    @Param('id') id: string,
    @Query('path') relativePath = '',
  ): Promise<unknown> {
    return this.fileSharesService.listItems(request.user, id, relativePath);
  }

  @Get(':id/file')
  @Permissions('file-shares.view')
  @Header('Cache-Control', 'no-store')
  async file(
    @Req() request: { user: RequestUser },
    @Param('id') id: string,
    @Query('path') relativePath: string,
    @Query('mode') mode: 'inline' | 'download' = 'inline',
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.fileSharesService.streamFile(
      request.user,
      id,
      relativePath,
      mode === 'download' ? 'attachment' : 'inline',
    );

    response.setHeader('Content-Type', result.contentType);
    response.setHeader('Content-Length', String(result.contentLength));
    response.setHeader(
      'Content-Disposition',
      `${mode === 'download' ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(result.filename)}`,
    );

    return result.file;
  }
}
