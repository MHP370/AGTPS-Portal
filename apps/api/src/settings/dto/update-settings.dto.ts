import {
  IsBoolean,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateSettingsDto {
  @IsString()
  companyName: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  favicon?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  portalBackgroundImageUrl?: string;

  @IsOptional()
  @IsString()
  portalBackgroundOverlayColor?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  portalBackgroundOverlayOpacity?: number;

  @IsOptional()
  @IsArray()
  portalWidgets?: unknown[];

  @IsOptional()
  @IsString()
  footerText?: string;

  @IsOptional()
  @IsBoolean()
  activeDirectoryEnabled?: boolean;

  @IsOptional()
  @IsString()
  activeDirectoryUrl?: string;

  @IsOptional()
  @IsString()
  activeDirectoryDomain?: string;

  @IsOptional()
  @IsString()
  activeDirectoryBaseDn?: string;

  @IsOptional()
  @IsString()
  activeDirectoryBindDn?: string;

  @IsOptional()
  @IsString()
  activeDirectoryBindPassword?: string;

  @IsOptional()
  @IsString()
  activeDirectoryUserSearchBase?: string;

  @IsOptional()
  @IsString()
  activeDirectoryGroupSearchBase?: string;

  @IsOptional()
  @IsString()
  activeDirectoryTlsServerName?: string;

  @IsOptional()
  @IsString()
  activeDirectoryCaCertificate?: string;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(10080)
  activeDirectorySyncIntervalMinutes?: number;

  @IsOptional()
  @IsBoolean()
  windowsSsoEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  requirePortalLogin?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(2048)
  trainingMaxUploadSizeMb?: number;

  @IsOptional()
  @IsString()
  trainingAllowedFileExtensions?: string;

  @IsOptional()
  @IsBoolean()
  requireUserPersonnelCode?: boolean;

  @IsOptional()
  @IsBoolean()
  requireUserBirthDate?: boolean;

  @IsOptional()
  @IsBoolean()
  requireUserEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  requireUserMobile?: boolean;

  @IsOptional()
  @IsIn(['FULL_NAME', 'PERSONNEL_CODE', 'USERNAME'])
  topbarUserDisplayMode?: 'FULL_NAME' | 'PERSONNEL_CODE' | 'USERNAME';
}
