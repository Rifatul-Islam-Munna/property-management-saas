import { BadRequestException, Injectable } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { MinioService } from 'src/lib/minio.service';

@Injectable()
export class UploadsService {
  constructor(private readonly minioService: MinioService) {}

  async uploadFile(file: Express.Multer.File, category?: string) {
    if (!file) {
      throw new BadRequestException('File required');
    }

    const url = await this.minioService.uploadFile(file);

    if (file.path) {
      await unlink(file.path).catch(() => null);
    }

    return {
      message: 'File uploaded successfully',
      category: category ?? 'general',
      url,
      fileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
