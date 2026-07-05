import {
  IsArray,
  IsString,
} from 'class-validator';

export class UpdateGroupMembersDto {
  @IsArray()
  @IsString({ each: true })
  userIds: string[];
}
