import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SWAGGER_TAGS } from '../../common/constants';
import { PaginationDto } from '../../common/dtos';
import { ICurrentUser } from '../../common/interfaces';
import { CurrentUser, Roles } from '../../core/decorators';
import { UserRole } from '../user/schemas/user.schema';
import { ComplaintService } from './complaint.service';
import {
  CreateComplaintDto,
  CreateComplaintResponseDto,
  GetComplaintResponseDto,
  GpsListResponseDto,
  ListComplaintsResponseDto,
  ReassignDepartmentDto,
  ReassignDepartmentResponseDto,
  SubmitFeedbackDto,
  SubmitFeedbackResponseDto,
  UpdateComplaintStatusResponseDto,
  UpdateStatusDto,
} from './dtos';

@ApiTags(SWAGGER_TAGS.COMPLAINT)
@Controller('complaints')
export class ComplaintController {
  constructor(private readonly complaintService: ComplaintService) {}

  @ApiOperation({
    summary: 'Submit a complaint',
    description:
      'Validates the complaint via AI, routes it to the responsible department, generates a ticket id and persists it.',
  })
  @ApiCreatedResponse({ type: CreateComplaintResponseDto })
  @Roles(UserRole.CITIZEN)
  @Post()
  create(@Body() data: CreateComplaintDto, @CurrentUser() currentUser: ICurrentUser) {
    return this.complaintService.create(data, currentUser.userId);
  }

  @ApiOperation({
    summary: 'List complaints (role-scoped)',
    description:
      'Returns paginated complaints scoped to the caller: a citizen sees their own, a department sees its own complaints, an admin sees all. Sorted by severity (desc) then newest.',
  })
  @ApiOkResponse({ type: ListComplaintsResponseDto })
  @Get()
  list(@Query() query: PaginationDto, @CurrentUser() currentUser: ICurrentUser) {
    return this.complaintService.list(query, currentUser.userId);
  }

  @ApiOperation({
    summary: 'Get all complaint GPS coordinates (admin)',
    description:
      'Returns an array of {lat, lng} for every complaint that has GPS data — useful for map heatmaps.',
  })
  @ApiOkResponse({ type: GpsListResponseDto })
  @Roles(UserRole.ADMIN, UserRole.DEPARTMENT)
  @Get('gps')
  getAllGps(@CurrentUser() currentUser: ICurrentUser) {
    return this.complaintService.getAllGps(currentUser.userId);
  }

  @ApiOperation({
    summary: 'Track a complaint by ticket id',
    description: 'Returns a complaint (with its department) by its human-readable ticket id.',
  })
  @ApiOkResponse({ type: GetComplaintResponseDto })
  @Get('ticket/:ticketId')
  getByTicketId(@Param('ticketId') ticketId: string) {
    return this.complaintService.findByTicketId(ticketId);
  }

  @ApiOperation({
    summary: 'Get a complaint by id',
    description: 'Returns a complaint (with its department) by its MongoDB ObjectId.',
  })
  @ApiOkResponse({ type: GetComplaintResponseDto })
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.complaintService.findById(id);
  }

  @ApiOperation({
    summary: 'Update complaint status (department/admin)',
    description:
      'Updates the status, appends to the status history, and stamps resolved metadata. A department user can only update complaints assigned to its department.',
  })
  @ApiOkResponse({ type: UpdateComplaintStatusResponseDto })
  @Roles(UserRole.DEPARTMENT, UserRole.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() data: UpdateStatusDto,
    @CurrentUser() currentUser: ICurrentUser,
  ) {
    return this.complaintService.updateStatus(id, data, currentUser.userId);
  }

  @ApiOperation({
    summary: 'Submit feedback for a resolved complaint (citizen)',
    description:
      'Allows the complaint owner to submit a rating and optional comment once the complaint is resolved. One feedback per complaint.',
  })
  @ApiCreatedResponse({ type: SubmitFeedbackResponseDto })
  @Roles(UserRole.CITIZEN)
  @Post(':id/feedback')
  submitFeedback(
    @Param('id') id: string,
    @Body() data: SubmitFeedbackDto,
    @CurrentUser() currentUser: ICurrentUser,
  ) {
    return this.complaintService.submitFeedback(id, data, currentUser.userId);
  }

  @ApiOperation({
    summary: 'Reassign complaint to a new department (department/admin)',
    description:
      'Reassigns a complaint to a different department and appends a history entry. A department user can only reassign complaints currently routed to their own department.',
  })
  @ApiOkResponse({ type: ReassignDepartmentResponseDto })
  @Roles(UserRole.DEPARTMENT, UserRole.ADMIN)
  @Patch(':id/department')
  reassignDepartment(
    @Param('id') id: string,
    @Body() data: ReassignDepartmentDto,
    @CurrentUser() currentUser: ICurrentUser,
  ) {
    return this.complaintService.reassignDepartment(id, data, currentUser.userId);
  }
}
