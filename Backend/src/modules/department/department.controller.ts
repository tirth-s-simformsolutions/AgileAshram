import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SWAGGER_TAGS } from '../../common/constants';

@ApiTags(SWAGGER_TAGS.DEPARTMENT)
@Controller('department')
export class DepartmentController {
  constructor() {}
}
