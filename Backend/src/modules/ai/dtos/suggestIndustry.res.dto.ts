import { ApiProperty, PickType } from '@nestjs/swagger';
import { CommonResponseDto } from '../../../common/dtos';

class SuggestIndustryDataDto {
  @ApiProperty({ example: '665f1a2b3c4d5e6f7a8b9c0d', nullable: true })
  industryId: string | null;

  @ApiProperty({ example: 'The complainant reports uncollected garbage causing overflow and odour near their street.' })
  summary: string;

  @ApiProperty({ enum: ['Low', 'Medium', 'High', 'Critical'], example: 'High' })
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
}

class SuggestIndustryResponseDto extends PickType(CommonResponseDto, ['error'] as const) {
  @ApiProperty({ example: 'Industries suggested successfully' })
  message: string;

  @ApiProperty({ type: SuggestIndustryDataDto })
  data: SuggestIndustryDataDto;
}

export { SuggestIndustryResponseDto, SuggestIndustryDataDto };
