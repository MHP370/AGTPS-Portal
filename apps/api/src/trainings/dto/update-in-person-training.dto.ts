import { PartialType } from '@nestjs/mapped-types';
import { CreateInPersonTrainingDto } from './create-in-person-training.dto';

export class UpdateInPersonTrainingDto extends PartialType(
  CreateInPersonTrainingDto,
) {}
