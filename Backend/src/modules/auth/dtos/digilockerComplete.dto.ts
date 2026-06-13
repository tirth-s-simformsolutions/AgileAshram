import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DigilockerCompleteDto {
  @ApiProperty({ description: 'Setu request ID received from DigiLocker callback', example: 'ea31e1e6-96eb-4e56-a355-7bc51de94d24' })
  @IsString()
  @IsNotEmpty()
  id: string;
}
