import {
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDirectManagerDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isCeo?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  portalUserId?: string;

  @IsOptional()
  @IsString()
  directoryUserId?: string;
}
