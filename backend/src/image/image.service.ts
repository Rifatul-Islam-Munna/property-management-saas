import { BadRequestException, Injectable } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { MinioService } from 'src/lib/minio.service';

@Injectable()
export class ImageService {
  constructor(private readonly minioService: MinioService) {}

  async uploadImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file required');
    }

    const imageUrl = await this.minioService.uploadFile(file);

    if (file.path) {
      await unlink(file.path).catch(() => null);
    }

    return {
      message: 'Image uploaded successfully',
      url: imageUrl,
      fileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
