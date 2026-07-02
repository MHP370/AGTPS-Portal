import {
  IsOptional,
  IsString,
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
  footerText?: string;
}
