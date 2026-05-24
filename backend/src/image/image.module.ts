import { Module } from '@nestjs/common';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { MinioService } from 'src/lib/minio.service';

@Module({
  controllers: [ImageController],
  providers: [ImageService, MinioService],
  exports: [ImageService],
})
export class ImageModule {}
