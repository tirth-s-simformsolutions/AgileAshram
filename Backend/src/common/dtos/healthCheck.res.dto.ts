import { ApiProperty, PickType } from '@nestjs/swagger';
import { CommonResponseDto } from './commonResponse.res.dto';

class HealthCheckDataDto {
  @ApiProperty({ example: 1000 })
  uptime: number;
}
export class HealthCheckResponseDto extends PickType(CommonResponseDto, ['error']) {
  @ApiProperty({ example: 'Operation successful' })
  message: string;

  @ApiProperty({ type: HealthCheckDataDto })
  data: HealthCheckDataDto;
}
