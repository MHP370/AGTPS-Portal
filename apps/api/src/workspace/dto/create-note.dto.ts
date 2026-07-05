import {
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateNoteDto {
  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}
