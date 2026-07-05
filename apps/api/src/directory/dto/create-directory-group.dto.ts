import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { DirectorySource } from '@prisma/client';

export class CreateDirectoryGroupDto {
  @IsString()
  name: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(DirectorySource)
  source?: DirectorySource;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
