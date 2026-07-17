import {
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateForbiddenWordDto {
  @IsString()
  word!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
