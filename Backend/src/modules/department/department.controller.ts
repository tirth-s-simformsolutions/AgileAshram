import { Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SWAGGER_TAGS } from '../../common/constants';
import { Public } from '../../core/decorators';
import { DepartmentService } from './department.service';

@ApiTags(SWAGGER_TAGS.DEPARTMENT)
@Controller('department')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @ApiOperation({
    summary: 'Seed default departments',
    description: 'Inserts the default department records if none exist.',
  })
  @ApiOkResponse({ description: 'Default departments seeded successfully.' })
  @Public()
  @Post('/seed')
  seedDefaultDepartments() {
    return this.departmentService.seedDefaultDepartments();
  }

}
