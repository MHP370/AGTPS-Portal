import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  NotificationTemplateCategory,
  NotificationTemplateStatus,
} from '@prisma/client';

export class CreateNotificationTemplateDto {
  @IsString()
  key!: string;

  @IsString()
  title!: string;

  @IsEnum(NotificationTemplateCategory)
  category!: NotificationTemplateCategory;

  @IsOptional()
  @IsEnum(NotificationTemplateStatus)
  status?: NotificationTemplateStatus;

  @IsString()
  subject!: string;

  @IsString()
  htmlBody!: string;

  @IsOptional()
  @IsString()
  textBody?: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, unknown>;
}
