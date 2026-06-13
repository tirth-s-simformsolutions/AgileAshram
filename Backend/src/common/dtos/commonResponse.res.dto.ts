import { ApiProperty } from '@nestjs/swagger';

export class CommonResponseDto {
  @ApiProperty({ type: 'object', nullable: true, default: null })
  data: null;

  @ApiProperty({ type: 'object', nullable: true, default: null })
  error: null;
}
