import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PollSurveyAnswerDto {
  @IsString()
  questionId: string;

  @IsOptional()
  @IsString()
  optionId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  optionIds?: string[];

  @IsOptional()
  @IsString()
  textValue?: string;

  @IsOptional()
  @IsNumber()
  numberValue?: number;

  @IsOptional()
  @IsString()
  dateValue?: string;

  @IsOptional()
  @IsBoolean()
  booleanValue?: boolean;

  @IsOptional()
  @IsObject()
  matrixValue?: Record<string, unknown>;
}

export class SubmitPollSurveyResponseDto {
  @IsString()
  participantKey: string;

  @IsOptional()
  @IsBoolean()
  saveDraft?: boolean;

  @IsOptional()
  @IsNumber()
  timeSpentSeconds?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PollSurveyAnswerDto)
  answers: PollSurveyAnswerDto[];
}
