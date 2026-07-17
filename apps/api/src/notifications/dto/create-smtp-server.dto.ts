import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { NotificationSmtpEncryption } from '@prisma/client';

export class CreateSmtpServerDto {
  @IsString()
  name!: string;

  @IsString()
  host!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  port!: number;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  senderName?: string;

  @IsEmail()
  senderEmail!: string;

  @IsOptional()
  @IsEmail()
  replyTo?: string;

  @IsOptional()
  @IsEnum(NotificationSmtpEncryption)
  encryption?: NotificationSmtpEncryption;

  @IsOptional()
  @IsInt()
  @Min(1000)
  timeoutMs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxRetry?: number;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
