import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { InPersonTrainingStatus } from '@prisma/client';

export class CreateInPersonTrainingDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  instructorName?: string;

  @IsOptional()
  @IsString()
  organizerDepartment?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsString()
  startDate: string;

  @IsOptional()
  @IsString()
  endDate?: string | null;

  @IsOptional()
  @IsNumber()
  durationHours?: number;

  @IsOptional()
  @IsBoolean()
  hasExam?: boolean;

  @IsOptional()
  @IsBoolean()
  hasCertificate?: boolean;

  @IsOptional()
  @IsEnum(InPersonTrainingStatus)
  status?: InPersonTrainingStatus;
}
