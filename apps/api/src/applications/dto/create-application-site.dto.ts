import { IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateApplicationSiteDto {
  @IsString()
  applicationId: string;

  @IsString()
  siteId: string;

  @IsUrl({
    require_tld: false,
  })
  url: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
