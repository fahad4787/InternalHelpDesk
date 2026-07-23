import { Module } from '@nestjs/common';
import { OneDriveController } from './onedrive.controller';
import { OneDriveService } from './onedrive.service';

@Module({
  controllers: [OneDriveController],
  providers: [OneDriveService],
  exports: [OneDriveService],
})
export class OneDriveModule {}
