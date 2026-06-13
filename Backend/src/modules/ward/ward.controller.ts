import { Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SWAGGER_TAGS } from '../../common/constants';
import { Public } from '../../core/decorators';
import { WardService } from './ward.service';

@ApiTags(SWAGGER_TAGS.WARD)
@Controller('ward')
export class WardController {
  constructor(private readonly wardService: WardService) {}

  @ApiOperation({
    summary: 'Seed default wards',
    description: 'Inserts the default ward records (with boundaries) if none exist.',
  })
  @ApiOkResponse({ description: 'Default wards seeded successfully.' })
  @Public()
  @Post('/seed')
  seedDefaultWards() {
    return this.wardService.seedDefaultWards();
  }
}
