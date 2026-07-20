import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsIn(['LOCAL', 'ACTIVE_DIRECTORY'])
  authSource?: 'LOCAL' | 'ACTIVE_DIRECTORY';
}
