import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  MeetingStatus,
  MeetingVisibility,
} from '@prisma/client';

export class MeetingParticipantDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  directoryUserId?: string;

  @IsString()
  displayName: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CreateMeetingDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsDateString()
  startAt: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsEnum(MeetingStatus)
  status?: MeetingStatus;

  @IsOptional()
  @IsEnum(MeetingVisibility)
  visibility?: MeetingVisibility;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsString()
  organizerId?: string;

  @IsOptional()
  @IsString()
  organizerDirectoryUserId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeetingParticipantDto)
  participants?: MeetingParticipantDto[];
}
