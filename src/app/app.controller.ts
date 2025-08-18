import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SWAGGER_TAGS } from '../common/constants';
import { HealthCheckResponseDto } from '../common/dtos';
import { HealthService } from '../common/services';
import { Public } from '../core/decorators';

@Controller()
export class AppController {
  constructor(private readonly healthService: HealthService) {}

  @ApiTags(SWAGGER_TAGS.GENERAL)
  @ApiOperation({
    summary: 'Service Health check API',
    description: 'This API is used to check health service and database connection',
  })
  @ApiOkResponse({
    description: 'Health check api success',
    type: HealthCheckResponseDto,
  })
  @Public()
  @Get('health-check')
  healthCheck() {
    return this.healthService.check();
  }
}
