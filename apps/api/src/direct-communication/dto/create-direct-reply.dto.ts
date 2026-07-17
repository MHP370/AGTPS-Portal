import { IsString } from 'class-validator';

export class CreateDirectReplyDto {
  @IsString()
  message!: string;
}
