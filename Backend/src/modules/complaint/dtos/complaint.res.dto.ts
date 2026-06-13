import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { CommonResponseDto } from '../../../common/dtos';
import { ComplaintSeverity, ComplaintStatus } from '../schemas/complaint.schema';

/* ------------------------------------------------------------------ *
 *  Embedded sub-document DTOs
 * ------------------------------------------------------------------ */

class GpsPointResDto {
  @ApiProperty({ example: 23.0225 })
  lat: number;

  @ApiProperty({ example: 72.5714 })
  lng: number;
}

class AiMetaResDto {
  @ApiProperty({ example: 'gemini' })
  model: string;

  @ApiProperty({ example: 0.87 })
  confidence: number;

  @ApiPropertyOptional({ example: 'pothole' })
  rawLabel?: string;

  @ApiProperty({ example: false })
  fallbackUsed: boolean;
}

class StatusHistoryEntryResDto {
  @ApiProperty({ enum: ComplaintStatus, example: ComplaintStatus.OPEN })
  status: ComplaintStatus;

  @ApiPropertyOptional({ example: 'Field team dispatched to the site.' })
  note?: string;

  @ApiProperty({ example: '2026-06-13T10:00:00.000Z' })
  at: string;

  @ApiPropertyOptional({ example: '665f1b2e3c4a5d6e7f8a9b0c' })
  byUserId?: string;
}

class DepartmentRefResDto {
  @ApiProperty({ example: '665f1b2e3c4a5d6e7f8a9b0c' })
  _id: string;

  @ApiProperty({ example: 'Infrastructure Department' })
  name: string;
}

class ResolutionNoteResDto {
  @ApiProperty({ example: 'Pothole has been filled and the road surface repaired.' })
  comment: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/demo/image/upload/resolved.jpg' })
  imageUrl?: string;
}

class FeedbackResDto {
  @ApiProperty({ example: 4 })
  rating: number;

  @ApiPropertyOptional({ example: 'The team resolved the issue quickly and professionally.' })
  comment?: string;

  @ApiProperty({ example: '2026-06-13T12:00:00.000Z' })
  submittedAt: string;
}

/* ------------------------------------------------------------------ *
 *  Root complaint DTO
 * ------------------------------------------------------------------ */

export class ComplaintResDto {
  @ApiProperty({ example: '665f1b2e3c4a5d6e7f8a9b0c' })
  _id: string;

  @ApiProperty({ example: 'NV-2026-000123' })
  ticketId: string;

  @ApiProperty({ example: '665f1b2e3c4a5d6e7f8a9b0a' })
  citizenId: string;

  @ApiProperty({ example: 'There is garbage overflowing near my street.' })
  description: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/demo/image/upload/complaint.jpg' })
  imageUrl?: string;

  @ApiProperty({ type: DepartmentRefResDto })
  departmentId: DepartmentRefResDto;

  @ApiProperty({ enum: ComplaintSeverity, example: ComplaintSeverity.HIGH })
  severity: ComplaintSeverity;

  @ApiProperty({ example: 3 })
  severityRank: number;

  @ApiPropertyOptional({ type: AiMetaResDto })
  aiMeta?: AiMetaResDto;

  @ApiPropertyOptional({ type: GpsPointResDto })
  gps?: GpsPointResDto;

  @ApiPropertyOptional({ example: 'Sector 12, Gandhinagar, Gujarat' })
  reportedAddress?: string;

  @ApiProperty({ enum: ComplaintStatus, example: ComplaintStatus.OPEN })
  status: ComplaintStatus;

  @ApiProperty({ type: [StatusHistoryEntryResDto] })
  statusHistory: StatusHistoryEntryResDto[];

  @ApiPropertyOptional({ example: '665f1b2e3c4a5d6e7f8a9b0c' })
  resolvedBy?: string;

  @ApiPropertyOptional({ example: '2026-06-13T12:00:00.000Z' })
  resolvedAt?: string;

  @ApiPropertyOptional({ type: ResolutionNoteResDto })
  resolutionNote?: ResolutionNoteResDto;

  @ApiProperty({ example: false })
  amcSubmitted: boolean;

  @ApiPropertyOptional({ type: FeedbackResDto })
  feedback?: FeedbackResDto;

  @ApiProperty({ example: '2026-06-13T10:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-06-13T10:00:00.000Z' })
  updatedAt: string;
}

/* ------------------------------------------------------------------ *
 *  Per-endpoint response DTOs
 * ------------------------------------------------------------------ */

export class CreateComplaintResponseDto extends PickType(CommonResponseDto, ['error'] as const) {
  @ApiProperty({ example: 'Complaint registered successfully' })
  message: string;

  @ApiProperty({ type: ComplaintResDto })
  data: ComplaintResDto;
}

export class ListComplaintsDataDto {
  @ApiProperty({ type: [ComplaintResDto] })
  complaints: ComplaintResDto[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 0 })
  page: number;

  @ApiProperty({ example: 10 })
  pageSize: number;
}

export class ListComplaintsResponseDto extends PickType(CommonResponseDto, ['error'] as const) {
  @ApiProperty({ example: 'Complaints fetched successfully' })
  message: string;

  @ApiProperty({ type: ListComplaintsDataDto })
  data: ListComplaintsDataDto;
}

export class GetComplaintResponseDto extends PickType(CommonResponseDto, ['error'] as const) {
  @ApiProperty({ example: 'Complaint fetched successfully' })
  message: string;

  @ApiProperty({ type: ComplaintResDto })
  data: ComplaintResDto;
}

export class UpdateComplaintStatusResponseDto extends PickType(CommonResponseDto, [
  'error',
] as const) {
  @ApiProperty({ example: 'Complaint status updated successfully' })
  message: string;

  @ApiProperty({ type: ComplaintResDto })
  data: ComplaintResDto;
}

export class ReassignDepartmentResponseDto extends PickType(CommonResponseDto, ['error'] as const) {
  @ApiProperty({ example: 'Complaint reassigned to new department successfully' })
  message: string;

  @ApiProperty({ type: ComplaintResDto })
  data: ComplaintResDto;
}

export class SubmitFeedbackResponseDto extends PickType(CommonResponseDto, ['error'] as const) {
  @ApiProperty({ example: 'Feedback submitted successfully' })
  message: string;

  @ApiProperty({ type: ComplaintResDto })
  data: ComplaintResDto;
}
