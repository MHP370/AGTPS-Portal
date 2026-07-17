import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import {
  BackupScheduleFrequency,
  BackupType,
} from '@prisma/client';

export class UpdateBackupSettingsDto {
  @IsOptional()
  @IsBoolean()
  autoEnabled?: boolean;

  @IsOptional()
  @IsEnum(BackupScheduleFrequency)
  frequency?: BackupScheduleFrequency;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  scheduleTime?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  weeklyDayOfWeek?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  monthlyDayOfMonth?: number;

  @IsOptional()
  @IsEnum(BackupType)
  type?: BackupType;

  @IsOptional()
  @IsBoolean()
  includeDatabase?: boolean;

  @IsOptional()
  @IsBoolean()
  includeUploads?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  retentionCount?: number;

  @IsOptional()
  @IsString()
  notifyEmails?: string;
}
