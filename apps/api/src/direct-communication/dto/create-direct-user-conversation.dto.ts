import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  DirectCommunicationCategory,
  DirectCommunicationMode,
  DirectCommunicationPriority,
} from '@prisma/client';

export class CreateDirectUserConversationDto {
  @IsString()
  managerId!: string;

  @IsOptional()
  @IsEnum(DirectCommunicationMode)
  mode?: DirectCommunicationMode;

  @IsOptional()
  @IsEnum(DirectCommunicationCategory)
  category?: DirectCommunicationCategory;

  @IsOptional()
  @IsEnum(DirectCommunicationPriority)
  priority?: DirectCommunicationPriority;

  @IsString()
  subject!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
