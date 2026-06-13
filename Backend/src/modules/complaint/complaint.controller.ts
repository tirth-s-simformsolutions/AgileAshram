import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SWAGGER_TAGS } from '../../common/constants';
import { ICurrentUser } from '../../common/interfaces';
import { CurrentUser } from '../../core/decorators';
import { ComplaintService } from './complaint.service';
import { CreateComplaintDto } from './dtos';

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
}
