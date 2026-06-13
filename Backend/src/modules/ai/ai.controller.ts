import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SWAGGER_TAGS } from '../../common/constants';
import { Public } from '../../core/decorators';
import { AiService } from './ai.service';
import { SuggestIndustryDto, SuggestIndustryResponseDto, ValidateComplaintDto, ValidateComplaintResponseDto } from './dtos';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @ApiTags(SWAGGER_TAGS.AI)
  @ApiOperation({
    summary: 'Suggest industries API',
    description: 'This API suggests relevant industry categories based on the provided text content',
  })
  @ApiOkResponse({
    description: 'Industries suggested successfully',
    type: SuggestIndustryResponseDto,
  })
  @Public()
  @Post('/suggest-industries')
  getSuggestedIndustries(@Body() data: SuggestIndustryDto) {
    return this.aiService.getSuggestedIndustry(data.content, data.place, data.time, data.imageUrl);
  }

  @ApiTags(SWAGGER_TAGS.AI)
  @ApiOperation({
    summary: 'Validate complaint API',
    description: 'This API checks whether a submitted complaint is legitimate and actionable by a civic authority',
  })
  @ApiOkResponse({
    description: 'Complaint validated successfully',
    type: ValidateComplaintResponseDto,
  })
  @Public()
  @Post('/validate-complaint')
  validateComplaint(@Body() data: ValidateComplaintDto) {
    return this.aiService.validateComplaint(data.content, data.place, data.imageUrl);
  }
}
