import { ApiProperty, PickType } from '@nestjs/swagger';
import { CommonResponseDto } from '../../../common/dtos';

class SetuInitiateDataDto {
  @ApiProperty({ example: 'ea31e1e6-96eb-4e56-a355-7bc51de94d24' })
  setuRequestId: string;

  @ApiProperty({ example: 'https://dg-sandbox.setu.co/digilocker/login?id=...' })
  loginUrl: string;
}

class DigilockerInitiateResponseDto extends PickType(CommonResponseDto, ['error'] as const) {
  @ApiProperty({ example: 'DigiLocker login initiated successfully' })
  message: string;

  @ApiProperty({ type: SetuInitiateDataDto })
  data: SetuInitiateDataDto;
}

export { DigilockerInitiateResponseDto };
