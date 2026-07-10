import { PartialType } from '@nestjs/swagger';
import { CreatePollSurveyDto } from './create-poll-survey.dto';

export class UpdatePollSurveyDto extends PartialType(CreatePollSurveyDto) {}
