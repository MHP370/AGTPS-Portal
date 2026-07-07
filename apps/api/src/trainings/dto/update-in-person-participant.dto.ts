import { PartialType } from '@nestjs/mapped-types';
import { CreateInPersonParticipantDto } from './create-in-person-participant.dto';

export class UpdateInPersonParticipantDto extends PartialType(
  CreateInPersonParticipantDto,
) {}
