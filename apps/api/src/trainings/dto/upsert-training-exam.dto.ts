import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { TrainingExamQuestionType } from '@prisma/client';

export class TrainingExamQuestionDto {
  @IsOptional() @IsString() id?: string;
  @IsEnum(TrainingExamQuestionType) type!: TrainingExamQuestionType;
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() options?: unknown[];
  @IsOptional() correctAnswer?: unknown;
  @IsNumber() @Min(0.25) points!: number;
  @IsInt() @Min(0) sortOrder!: number;
  @IsOptional() @IsBoolean() isRequired?: boolean;
}

export class UpsertTrainingExamDto {
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @Min(0) @Max(100) passingScore!: number;
  @IsOptional() @IsInt() @Min(1) durationMinutes?: number;
  @IsInt() @Min(1) @Max(20) maxAttempts!: number;
  @IsBoolean() shuffleQuestions!: boolean;
  @IsBoolean() showResultImmediately!: boolean;
  @IsBoolean() isPublished!: boolean;
  @IsArray() @ValidateNested({ each: true }) @Type(() => TrainingExamQuestionDto)
  questions!: TrainingExamQuestionDto[];
}

export class SubmitTrainingExamDto {
  @IsArray()
  answers!: Array<{ questionId: string; value: unknown }>;
}

export class UpsertCertificateTemplateDto {
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() backgroundUrl?: string;
  @IsObject() layout!: Record<string, unknown>;
  @IsOptional() @IsBoolean() isDefault?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TemplateSignatoryInputDto)
  signatories?: TemplateSignatoryInputDto[];
}

export class TemplateSignatoryInputDto {
  @IsString() signatoryId!: string;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsObject() position?: Record<string, unknown>;
}

export class IssueTrainingCertificateDto {
  @IsString() participantId!: string;
  @IsOptional() @IsString() templateId?: string;
  @IsString() certificateNumber!: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() fileUrl?: string;
  @IsOptional() @IsString() mimeType?: string;
  @IsOptional() @IsString() expiresAt?: string;
  @IsOptional() @IsString() notes?: string;
}
