import { PartialType } from '@nestjs/mapped-types';
import { CreateTrainingItemDto } from './create-training-item.dto';

export class UpdateTrainingItemDto extends PartialType(
  CreateTrainingItemDto,
) {}
