import { PartialType } from '@nestjs/mapped-types';
import { CreateDirectManagerDto } from './create-direct-manager.dto';

export class UpdateDirectManagerDto extends PartialType(
  CreateDirectManagerDto,
) {}
