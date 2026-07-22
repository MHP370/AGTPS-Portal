import { IsArray, IsBoolean, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class UnlockTrainingDto {
  @IsString() reason!: string;
}

export class UpsertTrainingSignatoryDto {
  @IsString() fullName!: string;
  @IsString() jobTitle!: string;
  @IsOptional() @IsString() signatureUrl?: string;
  @IsOptional() @IsString() stampUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() validFrom?: string | null;
  @IsOptional() @IsString() validUntil?: string | null;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}

export class TemplateSignatoryDto {
  @IsString() signatoryId!: string;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsObject() position?: Record<string, unknown>;
}

export class GenerateCertificatesDto {
  @IsOptional() @IsArray() @IsString({ each: true }) participantIds?: string[];
}
