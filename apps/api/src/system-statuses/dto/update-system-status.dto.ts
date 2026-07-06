import { PartialType } from '@nestjs/mapped-types';
import { CreateSystemStatusDto } from './create-system-status.dto';

export class UpdateSystemStatusDto extends PartialType(
  CreateSystemStatusDto,
) {}
