import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SWAGGER_TAGS } from '../../common/constants';
import { PaginationDto } from '../../common/dtos';
import { ICurrentUser } from '../../common/interfaces';
import { CurrentUser, Roles } from '../../core/decorators';
import { UserRole } from '../user/schemas/user.schema';
import { ComplaintService } from './complaint.service';
import { CreateComplaintDto, UpdateStatusDto } from './dtos';

@ApiTags(SWAGGER_TAGS.COMPLAINT)
@Controller('complaints')
export class ComplaintController {
  constructor(private readonly complaintService: ComplaintService) {}

  @ApiOperation({
    summary: 'Submit a complaint',
    description:
      'Validates the complaint via AI, routes it to the responsible department, generates a ticket id and persists it.',
  })
  @ApiCreatedResponse({ description: 'Complaint registered successfully' })
  @Post()
  create(@Body() data: CreateComplaintDto, @CurrentUser() currentUser: ICurrentUser) {
    return this.complaintService.create(data, currentUser.userId);
  }

  @ApiOperation({
    summary: 'List complaints (role-scoped)',
    description:
      'Returns paginated complaints scoped to the caller: a citizen sees their own, a department sees its own complaints, an admin sees all. Sorted by severity (desc) then newest.',
  })
  @ApiOkResponse({ description: 'Complaints fetched successfully' })
  @Get()
  list(@Query() query: PaginationDto, @CurrentUser() currentUser: ICurrentUser) {
    return this.complaintService.list(query, currentUser.userId);
  }

  @ApiOperation({
    summary: 'Track a complaint by ticket id',
    description: 'Returns a complaint (with its department) by its human-readable ticket id.',
  })
  @ApiOkResponse({ description: 'Complaint fetched successfully' })
  @Get('ticket/:ticketId')
  getByTicketId(@Param('ticketId') ticketId: string) {
    return this.complaintService.findByTicketId(ticketId);
  }

  @ApiOperation({
    summary: 'Get a complaint by id',
    description: 'Returns a complaint (with its department) by its MongoDB ObjectId.',
  })
  @ApiOkResponse({ description: 'Complaint fetched successfully' })
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.complaintService.findById(id);
  }

  @ApiOperation({
    summary: 'Update complaint status (department/admin)',
    description:
      'Updates the status, appends to the status history, and stamps resolved metadata. A department user can only update complaints assigned to its department.',
  })
  @ApiOkResponse({ description: 'Complaint status updated successfully' })
  @Roles(UserRole.DEPARTMENT, UserRole.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() data: UpdateStatusDto,
    @CurrentUser() currentUser: ICurrentUser,
  ) {
    return this.complaintService.updateStatus(id, data, currentUser.userId);
  }
}
