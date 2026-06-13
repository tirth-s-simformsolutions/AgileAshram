import { ApiProperty, PickType } from '@nestjs/swagger';
import { CommonResponseDto } from '../../../common/dtos';
import { UserAndTokenDataDto } from './login.res.dto';

class DigilockerCompleteResponseDto extends PickType(CommonResponseDto, ['error'] as const) {
  @ApiProperty({ example: 'Login successful' })
  message: string;

  @ApiProperty({ type: UserAndTokenDataDto })
  data: UserAndTokenDataDto;
}

export { DigilockerCompleteResponseDto };
