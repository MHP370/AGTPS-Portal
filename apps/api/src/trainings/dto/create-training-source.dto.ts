import {
  IsBoolean,
  IsOptional,
  IsString,
  IsInt,
  Min,
} from 'class-validator';

export class CreateTrainingSourceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsString()
  basePath: string;

  @IsOptional()
  @IsString()
  authMode?: string;

  @IsOptional()
  @IsString()
  realm?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  syncIntervalMinutes?: number;

  @IsOptional()
  @IsString()
  uploadDirectory?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
