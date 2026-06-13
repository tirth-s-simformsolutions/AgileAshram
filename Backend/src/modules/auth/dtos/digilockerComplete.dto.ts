import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { VALIDATION_MSG } from '../../../common/messages';

export class DigilockerCompleteDto {
  @ApiProperty({ description: 'Setu request ID received from DigiLocker callback', example: 'ea31e1e6-96eb-4e56-a355-7bc51de94d24' })
  @IsString({ message: VALIDATION_MSG.IS_STRING('id') })
  @IsNotEmpty({ message: VALIDATION_MSG.NOT_EMPTY('id') })
  id: string;
}
