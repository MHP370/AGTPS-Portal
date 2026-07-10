import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PollSurveyQuestionType } from '@prisma/client';

export class PollSurveyOptionDto {
  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class PollSurveyQuestionDto {
  @IsEnum(PollSurveyQuestionType)
  type: PollSurveyQuestionType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  conditionQuestionId?: string;

  @IsOptional()
  @IsString()
  conditionOperator?: string;

  @IsOptional()
  @IsString()
  conditionValue?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PollSurveyOptionDto)
  options?: PollSurveyOptionDto[];
}
