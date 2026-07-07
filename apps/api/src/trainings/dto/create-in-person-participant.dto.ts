import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  InPersonAttendanceStatus,
  InPersonTrainingResult,
} from '@prisma/client';

export class CreateInPersonParticipantDto {
  @IsOptional()
  @IsString()
  userId?: string | null;

  @IsOptional()
  @IsString()
  directoryUserId?: string | null;

  @IsString()
  displayName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(InPersonAttendanceStatus)
  attendanceStatus?: InPersonAttendanceStatus;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsEnum(InPersonTrainingResult)
  result?: InPersonTrainingResult;

  @IsOptional()
  @IsString()
  certificateNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
