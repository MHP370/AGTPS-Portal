import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join, resolve } from 'path';
import { randomUUID } from 'crypto';

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface UploadResult {
  url: string;
  fileName: string;
  originalName: string;
  size: number;
  mimeType: string;
}

const allowedFolders = new Set([
  'settings',
  'sites',
  'applications',
  'categories',
  'downloads',
  'icons',
  'sliders',
  'news',
  'announcements',
  'training',
]);

@Injectable()
export class UploadsService {
  async saveImage(
    folder: string,
    file?: UploadedFile,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('فایل انتخاب نشده است.');
    }

    if (!allowedFolders.has(folder)) {
      throw new BadRequestException('مسیر آپلود معتبر نیست.');
    }

    const extension = extname(file.originalname).toLowerCase();
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const uploadsRoot = this.getUploadsRoot();
    const targetDirectory = join(uploadsRoot, folder);

    await mkdir(targetDirectory, {
      recursive: true,
    });

    await writeFile(join(targetDirectory, fileName), file.buffer);

    return {
      url: `/uploads/${folder}/${fileName}`,
      fileName,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  private getUploadsRoot() {
    const cwd = process.cwd();

    if (cwd.endsWith('/apps/api')) {
      return resolve(cwd, '../web/public/uploads');
    }

    return resolve(cwd, 'apps/web/public/uploads');
  }
}
