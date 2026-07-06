import {
  IsBoolean,
  IsArray,
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
}
