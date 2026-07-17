import {
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';

export class RestoreBackupDto {
  @IsString()
  confirmation!: string;

  @IsOptional()
  @IsBoolean()
  restoreDatabase?: boolean;

  @IsOptional()
  @IsBoolean()
  restoreUploads?: boolean;
}
