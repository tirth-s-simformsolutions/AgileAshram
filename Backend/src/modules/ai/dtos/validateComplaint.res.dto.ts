import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { CommonResponseDto } from '../../../common/dtos';

class ImageAnalysisDto {
  @ApiProperty({ example: false })
  isValid: boolean;

  @ApiPropertyOptional({ description: 'Present only when isValid is false', example: 'The image appears to be a close-up shot without showing the surrounding area — could you share a wider view of the location?' })
  reason?: string;
}

class ValidateComplaintDataDto {
  @ApiProperty({ example: false })
  isLegit: boolean;

  @ApiPropertyOptional({ description: 'Present only when isLegit is false', example: 'Could you tell us about a specific civic issue you are experiencing, like a road problem, garbage collection, or water supply issue?' })
  reason?: string;

  @ApiProperty({ type: ImageAnalysisDto })
  imageAnalysis: ImageAnalysisDto;
}

class ValidateComplaintResponseDto extends PickType(CommonResponseDto, ['error'] as const) {
  @ApiProperty({ example: 'Complaint validated successfully' })
  message: string;

  @ApiProperty({ type: ValidateComplaintDataDto })
  data: ValidateComplaintDataDto;
}

export { ValidateComplaintResponseDto, ValidateComplaintDataDto };
