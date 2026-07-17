import { PartialType } from '@nestjs/swagger';
import { CreateSmtpServerDto } from './create-smtp-server.dto';

export class UpdateSmtpServerDto extends PartialType(CreateSmtpServerDto) {}
