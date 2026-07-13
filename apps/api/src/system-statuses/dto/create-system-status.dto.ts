import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { SystemHealthCheckType } from '@prisma/client';

export class CreateSystemStatusDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsEnum(SystemHealthCheckType)
  checkType?: SystemHealthCheckType;

  @IsOptional()
  @IsString()
  target?: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  expectedStatusCodes?: string;

  @IsOptional()
  @IsString()
  expectedKeyword?: string;

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(86400)
  intervalSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(60000)
  timeoutMs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
