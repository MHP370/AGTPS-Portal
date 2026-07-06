import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { mkdir, rename, unlink, writeFile } from 'fs/promises';
import { extname, join, resolve } from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  buffer?: Buffer;
  path?: string;
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
  constructor(private readonly prisma: PrismaService) {}

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

    if (folder === 'training') {
      await this.validateTrainingUpload(file, extension);
    }

    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const uploadsRoot = this.getUploadsRoot();
    const targetDirectory = join(uploadsRoot, folder);

    await mkdir(targetDirectory, {
      recursive: true,
    });

    if (file.path) {
      await rename(file.path, join(targetDirectory, fileName));
    } else if (file.buffer) {
      await writeFile(join(targetDirectory, fileName), file.buffer);
    } else {
      throw new BadRequestException('فایل آپلود شده قابل ذخیره نیست.');
    }

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

  private async validateTrainingUpload(
    file: UploadedFile,
    extension: string,
  ) {
    const settings = await this.prisma.setting.upsert({
      where: {
        id: 1,
      },
      update: {},
      create: {
        id: 1,
        companyName: 'AGTPS Portal',
      },
    });
    const maxSize =
      (settings.trainingMaxUploadSizeMb || 2048) * 1024 * 1024;
    const allowedExtensions = settings.trainingAllowedFileExtensions
      .split(',')
      .map((item) => item.trim().toLowerCase().replace(/^\./, ''))
      .filter(Boolean);
    const normalizedExtension = extension.replace(/^\./, '').toLowerCase();

    if (file.size > maxSize) {
      if (file.path) await unlink(file.path).catch(() => undefined);
      throw new BadRequestException(
        `حجم فایل بیشتر از ${settings.trainingMaxUploadSizeMb || 2048} مگابایت است.`,
      );
    }

    if (
      allowedExtensions.length > 0 &&
      !allowedExtensions.includes(normalizedExtension)
    ) {
      if (file.path) await unlink(file.path).catch(() => undefined);
      throw new BadRequestException('پسوند فایل آموزشی مجاز نیست.');
    }
  }
}
