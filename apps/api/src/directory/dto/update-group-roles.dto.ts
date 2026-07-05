import {
  IsArray,
  IsString,
} from 'class-validator';

export class UpdateGroupRolesDto {
  @IsArray()
  @IsString({ each: true })
  roleIds: string[];
}
