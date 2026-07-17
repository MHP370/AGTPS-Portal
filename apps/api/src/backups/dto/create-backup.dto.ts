import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { BackupType } from '@prisma/client';

export class CreateBackupDto {
  @IsOptional()
  @IsEnum(BackupType)
  type?: BackupType;

  @IsOptional()
  @IsBoolean()
  includeDatabase?: boolean;

  @IsOptional()
  @IsBoolean()
  includeUploads?: boolean;

  @IsOptional()
  @IsEmail()
  notifyEmail?: string;
}
