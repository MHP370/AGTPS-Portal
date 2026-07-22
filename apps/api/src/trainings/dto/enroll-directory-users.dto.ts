import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class EnrollDirectoryUsersDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  directoryUserIds: string[];
}
