import { PartialType } from '@nestjs/swagger';
import { CreateApplicationSiteDto } from './create-application-site.dto';

export class UpdateApplicationSiteDto extends PartialType(
  CreateApplicationSiteDto,
) {}
