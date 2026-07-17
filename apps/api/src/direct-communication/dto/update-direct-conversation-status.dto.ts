import { IsEnum } from 'class-validator';
import { DirectCommunicationStatus } from '@prisma/client';

export class UpdateDirectConversationStatusDto {
  @IsEnum(DirectCommunicationStatus)
  status!: DirectCommunicationStatus;
}
