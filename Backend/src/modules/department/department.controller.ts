import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiForbiddenResponse } from '@nestjs/swagger';
import { SWAGGER_TAGS } from '../../common/constants';
import { PaginationWithSearchDto } from '../../common/dtos';
import { Roles } from '../../core/decorators';
import { UserRole } from '../user/schemas/user.schema';
import { ListDepartmentsResponseDto } from './dtos';
import { DepartmentService } from './department.service';

@ApiTags(SWAGGER_TAGS.DEPARTMENT)
@Controller('department')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @ApiOperation({
    summary: 'Get departments list API',
    description: 'This API is used to get list of all departments. Only accessible to admin and department role users.',
  })
  @ApiOkResponse({
    description: 'Departments listed successfully',
    type: ListDepartmentsResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - only admin and department roles can access this endpoint',
  })
  @Roles(UserRole.ADMIN, UserRole.DEPARTMENT)
  @Get()
  list(@Query() pagination: PaginationWithSearchDto) {
    return this.departmentService.list(pagination);
  }
}
