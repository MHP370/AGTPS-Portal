import {
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

class PushSubscriptionKeysDto {
  @IsString()
  p256dh: string;

  @IsString()
  auth: string;
}

export class PushSubscriptionDto {
  @IsString()
  endpoint: string;

  @IsObject()
  keys: PushSubscriptionKeysDto;

  @IsOptional()
  @IsString()
  recipientDirectoryUserId?: string;

  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}
