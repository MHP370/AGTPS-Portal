import {
  IsEmail,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class QueueEmailDto {
  @IsEmail()
  recipientEmail!: string;

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  htmlBody?: string;

  @IsOptional()
  @IsString()
  textBody?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxRetry?: number;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, unknown>;
}
