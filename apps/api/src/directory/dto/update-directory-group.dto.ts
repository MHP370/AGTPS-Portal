import { PartialType } from '@nestjs/mapped-types';
import { CreateDirectoryGroupDto } from './create-directory-group.dto';

export class UpdateDirectoryGroupDto extends PartialType(
  CreateDirectoryGroupDto,
) {}
