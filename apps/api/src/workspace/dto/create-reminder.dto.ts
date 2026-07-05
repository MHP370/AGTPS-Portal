import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateReminderDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  remindAt: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
