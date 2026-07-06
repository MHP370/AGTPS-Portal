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

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsString()
  siteId: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
