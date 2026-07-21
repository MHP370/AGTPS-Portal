import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ShareAccessDto {
  @IsString()
  id!: string;

  @IsOptional()
  @IsBoolean()
  canRead?: boolean;

  @IsOptional()
  @IsBoolean()
  canDownload?: boolean;

  @IsOptional()
  @IsBoolean()
  canUpload?: boolean;

  @IsOptional()
  @IsBoolean()
  canDelete?: boolean;
}

export class CreateFileShareDto {
  @IsString()
  @MaxLength(80)
  key!: string;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  rootPath!: string;

  @IsOptional()
  @IsString()
  uncPath?: string;

  @IsOptional()
  @IsString()
  authMode?: string;

  @IsOptional()
  @IsString()
  realm?: string;

  @IsOptional()
  @IsString()
  sharedUsername?: string;

  @IsOptional()
  @IsString()
  sharedPassword?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  allowDownload?: boolean;

  @IsOptional()
  @IsBoolean()
  allowUpload?: boolean;

  @IsOptional()
  @IsBoolean()
  allowDelete?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  userAccesses?: ShareAccessDto[];

  @IsOptional()
  @IsArray()
  groupAccesses?: ShareAccessDto[];
}
