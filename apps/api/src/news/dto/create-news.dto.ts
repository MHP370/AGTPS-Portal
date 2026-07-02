import {
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateNewsDto {
  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsString()
  siteId: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
