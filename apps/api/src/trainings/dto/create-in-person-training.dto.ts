import {
  IsBoolean,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  InPersonTrainingStatus,
  TrainingCertificateMode,
  TrainingCertificateNumberStrategy,
} from '@prisma/client';

export class CreateInPersonTrainingDto {
  @IsString()
  courseCode: string;

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

  @IsOptional() @IsArray() @IsString({ each: true }) directoryUserIds?: string[];
  @IsOptional() @IsEnum(TrainingCertificateMode) certificateMode?: TrainingCertificateMode;
  @IsOptional() @IsString() certificateTemplateId?: string | null;
  @IsOptional() @IsEnum(TrainingCertificateNumberStrategy) certificateNumberStrategy?: TrainingCertificateNumberStrategy;
  @IsOptional() @IsInt() certificateNumberStart?: number;
  @IsOptional() @IsString() certificateNumberPattern?: string;
  @IsOptional() @IsString() certificateValidationRegex?: string | null;
  @IsOptional() @IsBoolean() certificateRequiresCompletion?: boolean;
  @IsOptional() @IsBoolean() certificateRequiresPass?: boolean;
}
