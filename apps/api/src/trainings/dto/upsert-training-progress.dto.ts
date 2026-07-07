import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { TrainingProgressStatus } from '@prisma/client';

export class UpsertTrainingProgressDto {
  @IsString()
  visitorKey: string;

  @IsOptional()
  @IsEnum(TrainingProgressStatus)
  status?: TrainingProgressStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lastPositionSeconds?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationSeconds?: number;

  @IsOptional()
  @IsString()
  lastFileUrl?: string;
}
