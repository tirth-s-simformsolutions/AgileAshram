import { ApiProperty, PickType } from '@nestjs/swagger';
import { CommonResponseDto } from '../../../common/dtos';

export class R2ObjectDto {
  @ApiProperty({ example: 'images/550e8400-e29b-41d4-a716-446655440000-photo.jpg' })
  key: string;

  @ApiProperty({ example: 204800 })
  size: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  lastModified: string;

  @ApiProperty({ example: 'https://pub-xxxx.r2.dev/images/550e8400-e29b-41d4-a716-446655440000-photo.jpg' })
  publicUrl: string;
}

export class ListImagesDataDto {
  @ApiProperty({ type: [R2ObjectDto] })
  images: R2ObjectDto[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class ListImagesResponseDto extends PickType(CommonResponseDto, ['error'] as const) {
  @ApiProperty({ example: 'Images listed successfully' })
  message: string;

  @ApiProperty({ type: ListImagesDataDto })
  data: ListImagesDataDto;
}
