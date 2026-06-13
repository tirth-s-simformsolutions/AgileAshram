import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { handleError } from '../../common/utils';
import { ResponseResult } from '../../core/class';
import { SUCCESS_MSG } from './messages';

const PRESIGNED_URL_EXPIRES_IN = 900;

@Injectable()
export class UploadService {
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('cloudflare.r2.accessKeyId');
    const secretAccessKey = this.configService.get<string>('cloudflare.r2.secretAccessKey');
    const endpoint = this.configService.get<string>('cloudflare.r2.endpoint');

    this.bucketName = this.configService.get<string>('cloudflare.r2.bucketName');
    this.publicUrl = this.configService.get<string>('cloudflare.r2.publicUrl');

    this.client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  async getPresignedUrl(filename: string, contentType: string) {
    try {
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const key = `images/${randomUUID()}-${sanitizedFilename}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      const presignedUrl = await getSignedUrl(this.client, command, {
        expiresIn: PRESIGNED_URL_EXPIRES_IN,
      });

      return new ResponseResult({
        message: SUCCESS_MSG.PRESIGNED_URL_GENERATED,
        data: {
          presignedUrl,
          key,
          publicUrl: `${this.publicUrl}/${key}`,
          expiresIn: PRESIGNED_URL_EXPIRES_IN,
        },
      });
    } catch (error) {
      handleError(error);
    }
  }

  async listImages(page: number = 1, limit: number = 20) {
    try {
      const allObjects = [];
      let continuationToken: string | undefined;

      do {
        const command = new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: 'images/',
          MaxKeys: 1000,
          ContinuationToken: continuationToken,
        });
        const response = await this.client.send(command);
        allObjects.push(...(response.Contents ?? []));
        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      const total = allObjects.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const images = allObjects.slice(start, start + limit).map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified?.toISOString(),
        publicUrl: `${this.publicUrl}/${obj.Key}`,
      }));

      return new ResponseResult({
        message: SUCCESS_MSG.IMAGES_LISTED,
        data: { images, total, page, totalPages },
      });
    } catch (error) {
      handleError(error);
    }
  }

  async deleteImage(key: string) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);

      return new ResponseResult({
        message: SUCCESS_MSG.IMAGE_DELETED,
      });
    } catch (error) {
      handleError(error);
    }
  }
}
