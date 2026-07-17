import {
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';

export class TestSmtpDto {
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  body?: string;
}
