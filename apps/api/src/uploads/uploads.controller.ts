import {
  BadRequestException,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { extname, resolve } from 'path';
import { randomUUID } from 'crypto';

import { UploadsService } from './uploads.service';
import type { UploadedFile as UploadedImageFile } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadPermissionsGuard } from './guards/upload-permissions.guard';

const allowedImageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

const allowedDocumentMimeTypes = new Set([
  ...allowedImageMimeTypes,
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'video/mp4',
  'video/webm',
  'video/x-matroska',
  'video/quicktime',
  'video/x-msvideo',
  'application/octet-stream',
]);

const documentFolders = new Set([
  'downloads',
  'news',
  'announcements',
  'training',
]);

function getUploadTempDirectory() {
  const cwd = process.cwd();

  if (cwd.endsWith('/apps/api')) {
    return resolve(cwd, '../web/public/uploads/.tmp');
  }

  return resolve(cwd, 'apps/web/public/uploads/.tmp');
}

@Controller('uploads')
@UseGuards(JwtAuthGuard, UploadPermissionsGuard)
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
  ) {}

  @Post(':folder')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (request, file, callback) => {
          const directory = getUploadTempDirectory();
          mkdirSync(directory, {
            recursive: true,
          });
          callback(null, directory);
        },
        filename: (request, file, callback) => {
          callback(
            null,
            `${Date.now()}-${randomUUID()}${extname(file.originalname).toLowerCase()}`,
          );
        },
      }),
      limits: {
        fileSize: 2 * 1024 * 1024 * 1024,
      },
      fileFilter: (request, file, callback) => {
        const folder = request.params.folder;
        if (folder === 'training') {
          callback(null, true);
          return;
        }

        const allowedMimeTypes = documentFolders.has(folder)
          ? allowedDocumentMimeTypes
          : allowedImageMimeTypes;

        if (!allowedMimeTypes.has(file.mimetype)) {
          callback(
            new BadRequestException(
              documentFolders.has(folder)
                ? 'نوع فایل انتخاب‌شده مجاز نیست.'
                : 'فقط فایل تصویری مجاز است.',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  uploadImage(
    @Param('folder') folder: string,
    @UploadedFile() file: UploadedImageFile,
  ) {
    return this.uploadsService.saveImage(folder, file);
  }
}
