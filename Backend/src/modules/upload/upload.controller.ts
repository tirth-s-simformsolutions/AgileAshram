import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SWAGGER_TAGS } from '../../common/constants';
import { ListImagesResponseDto, PresignedUrlRequestDto, PresignedUrlResponseDto } from './dtos';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @ApiTags(SWAGGER_TAGS.UPLOAD)
  @ApiOperation({
    summary: 'Get presigned upload URL',
    description:
      'Returns a presigned PUT URL (valid 5 min). The FE uploads the image directly to R2 using this URL — the image never passes through the backend.',
  })
  @ApiOkResponse({
    description: 'Presigned URL generated successfully',
    type: PresignedUrlResponseDto,
  })
  @Post('presigned-url')
  getPresignedUrl(@Body() body: PresignedUrlRequestDto) {
    return this.uploadService.getPresignedUrl(body.filename, body.contentType);
  }

  @ApiTags(SWAGGER_TAGS.UPLOAD)
  @ApiOperation({
    summary: 'List images',
    description: 'Returns up to 20 images from R2. Pass nextContinuationToken to paginate.',
  })
  @ApiOkResponse({ description: 'Images listed successfully', type: ListImagesResponseDto })
  @Get('images')
  listImages(@Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.uploadService.listImages(Number(page), Number(limit));
  }

  @ApiTags(SWAGGER_TAGS.UPLOAD)
  @ApiOperation({
    summary: 'Delete image',
    description: 'Deletes an image from R2 by its key (e.g. images/uuid-photo.jpg).',
  })
  @ApiOkResponse({ description: 'Image deleted successfully' })
  @Delete('images/:key(*)')
  deleteImage(@Param('key') key: string) {
    return this.uploadService.deleteImage(key);
  }
}
