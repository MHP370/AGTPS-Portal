import { PartialType } from '@nestjs/mapped-types';
import { CreateTrainingCategoryDto } from './create-training-category.dto';

export class UpdateTrainingCategoryDto extends PartialType(
  CreateTrainingCategoryDto,
) {}
