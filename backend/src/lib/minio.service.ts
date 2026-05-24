import {
  CreateBucketCommand,
  DeleteObjectCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'fs';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private s3!: S3Client;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const minioUrl = this.configService.get<string>('MINIO_URL');
    const accessKeyId = this.configService.get<string>('MINIO_ACCESS_KEY');
    const secretAccessKey =
      this.configService.get<string>('MINIO_SECRET_KEY');

    if (!minioUrl || !accessKeyId || !secretAccessKey) {
      this.logger.warn('MinIO env missing. Skip client init.');
      return;
    }

    this.s3 = new S3Client({
      region: 'us-east-1',
      endpoint: minioUrl,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });

    const bucketName =
      this.configService.get<string>('MINIO_BUCKET') ?? 'property-public-bucket';

    await this.createBucketIfNotExists(bucketName);
    await this.makeBucketPublic(bucketName);
  }

  async createBucketIfNotExists(bucketName: string) {
    if (!this.s3) return;

    try {
      await this.s3.send(new CreateBucketCommand({ Bucket: bucketName }));
    } catch (err: unknown) {
      const name = (err as { name?: string })?.name;

      if (name !== 'BucketAlreadyOwnedByYou' && name !== 'BucketAlreadyExists') {
        throw err;
      }
    }
  }

  async makeBucketPublic(bucketName: string) {
    if (!this.s3) return;

    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicRead',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    };

    await this.s3.send(
      new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify(policy),
      }),
    );
  }

  async uploadFile(file: Express.Multer.File) {
    if (!this.s3) {
      throw new HttpException('MinIO not configured', HttpStatus.BAD_REQUEST);
    }

    const bucketName =
      this.configService.get<string>('MINIO_BUCKET') ?? 'property-public-bucket';

    try {
      const fileContent = createReadStream(file.path);

      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: file.filename,
          Body: fileContent,
          ContentType: file.mimetype,
        }),
      );

      return `${this.configService.get('MINIO_URL')}/${bucketName}/${file.filename}`;
    } catch (err) {
      this.logger.error('Error uploading file', (err as Error)?.stack);
      throw new HttpException(
        'Failed to upload file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteService(fileName: string) {
    if (!this.s3) {
      throw new HttpException('MinIO not configured', HttpStatus.BAD_REQUEST);
    }

    if (!fileName) {
      throw new HttpException('Invalid file name', HttpStatus.BAD_REQUEST);
    }

    const bucketName =
      this.configService.get<string>('MINIO_BUCKET') ?? 'property-public-bucket';

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      }),
    );

    return true;
  }
}
