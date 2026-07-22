import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  PollSurveyParticipationMode,
  PollSurveyStatus,
  PollSurveyType,
} from '@prisma/client';
import {
  PollSurveyOptionDto,
  PollSurveyQuestionDto,
} from './poll-survey-question.dto';

export class CreatePollSurveyDto {
  @IsEnum(PollSurveyType)
  type: PollSurveyType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  allowMultipleSelection?: boolean;

  @IsOptional()
  @IsBoolean()
  anonymous?: boolean;

  @IsOptional()
  @IsEnum(PollSurveyParticipationMode)
  participationMode?: PollSurveyParticipationMode;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsBoolean()
  popupEnforced?: boolean;

  @IsOptional()
  @IsBoolean()
  allowVoteEditing?: boolean;

  @IsOptional()
  @IsString()
  deadline?: string | null;

  @IsOptional()
  @IsString()
  publishDate?: string | null;

  @IsOptional()
  @IsEnum(PollSurveyStatus)
  status?: PollSurveyStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetUserIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetDepartments?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetAdGroupIds?: string[];

  @IsOptional()
  @IsBoolean()
  allowResultViewing?: boolean;

  @IsOptional()
  @IsBoolean()
  allowParticipantCount?: boolean;

  @IsOptional()
  @IsBoolean()
  allowLiveResults?: boolean;

  @IsOptional()
  @IsBoolean()
  participantVisibility?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PollSurveyQuestionDto)
  questions?: PollSurveyQuestionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PollSurveyOptionDto)
  options?: PollSurveyOptionDto[];
}
