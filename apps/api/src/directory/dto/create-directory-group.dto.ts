import {
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDirectoryGroupDto {
  @IsString()
  name: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
