import { PartialType } from '@nestjs/mapped-types';
import { CreateTrainingSourceDto } from './create-training-source.dto';

export class UpdateTrainingSourceDto extends PartialType(
  CreateTrainingSourceDto,
) {}
