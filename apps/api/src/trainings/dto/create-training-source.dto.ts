import {
  IsBoolean,
  IsOptional,
  IsString,
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
  description?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
