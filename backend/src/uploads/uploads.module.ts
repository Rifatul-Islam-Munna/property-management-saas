import { Module } from '@nestjs/common';
import { MinioService } from 'src/lib/minio.service';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService, MinioService],
  exports: [UploadsService],
})
export class UploadsModule {}
