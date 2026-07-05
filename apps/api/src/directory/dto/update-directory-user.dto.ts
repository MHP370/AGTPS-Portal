import { PartialType } from '@nestjs/mapped-types';
import { CreateDirectoryUserDto } from './create-directory-user.dto';

export class UpdateDirectoryUserDto extends PartialType(
  CreateDirectoryUserDto,
) {}
