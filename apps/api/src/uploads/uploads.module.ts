import { Module } from '@nestjs/common';

import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { UploadPermissionsGuard } from './guards/upload-permissions.guard';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService, UploadPermissionsGuard],
})
export class UploadsModule {}
