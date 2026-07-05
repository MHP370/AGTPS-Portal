import {
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
  @IsString()
  footerText?: string;
}
