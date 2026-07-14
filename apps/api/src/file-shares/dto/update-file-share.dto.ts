import { PartialType } from '@nestjs/swagger';
import { CreateFileShareDto } from './create-file-share.dto';

export class UpdateFileShareDto extends PartialType(CreateFileShareDto) {}
