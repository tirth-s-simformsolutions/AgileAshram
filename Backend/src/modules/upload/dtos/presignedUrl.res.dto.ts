import { ApiProperty, PickType } from '@nestjs/swagger';
import { CommonResponseDto } from '../../../common/dtos';

export class PresignedUrlDataDto {
  @ApiProperty({ example: 'https://<account>.r2.cloudflarestorage.com/bucket/images/uuid-photo.jpg?...' })
  presignedUrl: string;

  @ApiProperty({ example: 'images/550e8400-e29b-41d4-a716-446655440000-photo.jpg' })
  key: string;

  @ApiProperty({ example: 'https://pub-xxxx.r2.dev/images/550e8400-e29b-41d4-a716-446655440000-photo.jpg' })
  publicUrl: string;

  @ApiProperty({ example: 900 })
  expiresIn: number;
}

export class PresignedUrlResponseDto extends PickType(CommonResponseDto, ['error'] as const) {
  @ApiProperty({ example: 'Presigned URL generated successfully' })
  message: string;

  @ApiProperty({ type: PresignedUrlDataDto })
  data: PresignedUrlDataDto;
}
