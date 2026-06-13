import { ApiProperty } from '@nestjs/swagger';

export class DigilockerInitiateResponseDto {
  @ApiProperty({ example: 'ea31e1e6-96eb-4e56-a355-7bc51de94d24' })
  setuRequestId: string;

  @ApiProperty({ example: 'https://dg-sandbox.setu.co/digilocker/login?id=...' })
  loginUrl: string;
}
