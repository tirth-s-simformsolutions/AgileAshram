import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { FilterQuery, Types } from 'mongoose';
import { I18nService } from 'nestjs-i18n';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../../common/constants';
import { PaginationDto } from '../../common/dtos';
import { handleError } from '../../common/utils';
import { ResponseResult } from '../../core/class';
import { AiService } from '../ai/ai.service';
import { CounterService } from '../counter/counter.service';
import { DepartmentRepository } from '../department/department.repository';
import { SmsService } from '../sms/sms.service';
import { UserRole } from '../user/schemas/user.schema';
import { UserRepository } from '../user/user.repository';
import { WardService } from '../ward/ward.service';
import { ComplaintRepository } from './complaint.repository';
import {
  CreateComplaintDto,
  ReassignDepartmentDto,
  SubmitFeedbackDto,
  UpdateStatusDto,
} from './dtos';
import { ERROR_MSG, SMS_MSG, SUCCESS_MSG } from './messages';
import { ComplaintDocument, ComplaintSeverity, ComplaintStatus } from './schemas/complaint.schema';

/** Shapes returned inside the AiService ResponseResult.data payloads. */
interface ValidationData {
  isLegit: boolean;
  reason?: string;
  imageAnalysis?: { isValid: boolean; reason?: string };
}
interface SuggestionData {
  industryId: string | null;
  summary: string;
  severity: ComplaintSeverity;
}

@Injectable()
export class ComplaintService {
  constructor(
    private readonly complaintRepository: ComplaintRepository,
    private readonly aiService: AiService,
    private readonly counterService: CounterService,
    private readonly departmentRepository: DepartmentRepository,
    private readonly userRepository: UserRepository,
    private readonly smsService: SmsService,
    private readonly i18n: I18nService,
    private readonly wardService: WardService,
  ) {}

  private sendStatusSms(
    phone: string | undefined,
    status: ComplaintStatus,
    ticketId: string,
    departmentName: string,
  ): void {
    if (!phone) return;
    const body = String(
      this.i18n.t(SMS_MSG.COMPLAINT[status], { args: { ticketId, departmentName } }),
    );
    this.smsService.send({ to: phone, body, metadata: { ticketId, status } }).catch(() => void 0);
  }

  /**
   * Role-scoped, paginated list (shared endpoint):
   *   citizen    -> only their own complaints
   *   department -> complaints routed to their department
   *   admin      -> all complaints
   */
  async list(query: PaginationDto, currentUserId: string) {
    try {
      const user = await this.userRepository.findUserById(currentUserId);
      if (!user) {
        throw new NotFoundException(ERROR_MSG.COMPLAINT.NOT_FOUND);
      }

      const filter: FilterQuery<ComplaintDocument> = {};
      if (user.role === UserRole.CITIZEN) {
        filter.citizenId = new Types.ObjectId(currentUserId);
      } else if (user.role === UserRole.DEPARTMENT) {
        filter.departmentId = user.departmentId;
      }
      // admin -> no filter (all complaints)

      const page = query.page ?? DEFAULT_PAGE;
      const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
      const skip = page * pageSize;

      const [complaints, total] = await Promise.all([
        this.complaintRepository.list(filter, skip, pageSize),
        this.complaintRepository.count(filter),
      ]);

      return new ResponseResult({
        message: SUCCESS_MSG.COMPLAINT.FETCHED,
        data: { complaints, total, page, pageSize },
      });
    } catch (error) {
      handleError(error);
    }
  }

  /**
   * Citizen submits a complaint:
   *   validate (AI) -> route to a department (AI) -> generate ticket -> persist.
   */
  async create(dto: CreateComplaintDto, citizenId: string) {
    try {
      const place = dto.location.address ?? '';

      // 1. Validate legitimacy + image relevance via AI; reject with the friendly reason.
      const validationRes = await this.aiService.validateComplaint(
        dto.description,
        place,
        dto.imageUrl,
      );
      const validation = validationRes?.data as ValidationData;
      if (!validation?.isLegit) {
        throw new BadRequestException(validation?.reason ?? ERROR_MSG.COMPLAINT.INVALID);
      }
      if (validation.imageAnalysis && !validation.imageAnalysis.isValid) {
        throw new BadRequestException(
          validation.imageAnalysis.reason ?? ERROR_MSG.COMPLAINT.INVALID,
        );
      }

      // 2. Route to the responsible department (responsibility-driven AI routing).
      const time = new Date().toISOString();
      const suggestionRes = await this.aiService.getSuggestedIndustry(
        dto.description,
        place,
        time,
        dto.imageUrl,
      );
      const suggestion = suggestionRes?.data as SuggestionData;

      let departmentId = suggestion?.industryId ?? null;
      if (!departmentId) {
        // Fallback: route to the first configured department so nothing is orphaned.
        const departments = await this.departmentRepository.findAll();
        if (!departments.length) {
          throw new InternalServerErrorException(ERROR_MSG.COMPLAINT.NO_DEPARTMENT);
        }
        departmentId = String(departments[0]._id);
      }

      // 3. Resolve the ward from the GPS point (null if outside known wards).
      const ward = await this.wardService.findByPoint(dto.location.lat, dto.location.lng);

      // 4. Human-readable ticket id (atomic).
      const ticketId = await this.counterService.nextTicketId();

      // 5. Persist (severityRank is derived from severity by the schema pre-save hook).
      const now = new Date();
      const complaint = await this.complaintRepository.create({
        ticketId,
        citizenId: new Types.ObjectId(citizenId),
        description: dto.description,
        imageUrl: dto.imageUrl,
        departmentId: new Types.ObjectId(departmentId),
        severity: this.resolveSeverity(suggestion?.severity), // AI-scored; severityRank derived by hook
        gps: { lat: dto.location.lat, lng: dto.location.lng },
        reportedAddress: dto.location.address,
        wardId: ward?._id as Types.ObjectId | undefined,
        wardNumber: ward?.number,
        status: ComplaintStatus.OPEN,
        aiMeta: {
          model: 'gemini',
          confidence: 0,
          rawLabel: suggestion?.summary,
          fallbackUsed: false,
        },
        statusHistory: [{ status: ComplaintStatus.OPEN, at: now }],
      });

      const [citizen, department] = await Promise.all([
        this.userRepository.findUserById(citizenId),
        this.departmentRepository.findById(departmentId),
      ]);
      this.sendStatusSms(citizen?.phone, ComplaintStatus.OPEN, ticketId, department?.name ?? '');

      // Populate department + ward (sans boundary) so the response carries their names.
      await complaint.populate([
        { path: 'departmentId' },
        { path: 'wardId', select: 'number name zone' },
      ]);

      return new ResponseResult({ message: SUCCESS_MSG.COMPLAINT.CREATED, data: complaint });
    } catch (error) {
      handleError(error);
    }
  }

  /**
   * Update a complaint's status (department/admin only — enforced by RolesGuard).
   * A department user may only act on complaints routed to their own department.
   * Appends to statusHistory and stamps resolvedBy/resolvedAt on RESOLVED.
   */
  async updateStatus(id: string, dto: UpdateStatusDto, currentUserId: string) {
    try {
      const user = await this.userRepository.findUserById(currentUserId);
      if (!user) {
        throw new ForbiddenException(ERROR_MSG.COMPLAINT.NOT_YOUR_DEPARTMENT);
      }

      const complaint = await this.complaintRepository.findDocById(id);
      if (!complaint) {
        throw new NotFoundException(ERROR_MSG.COMPLAINT.NOT_FOUND);
      }

      // A department user can only act on its own department's complaints.
      if (
        user.role === UserRole.DEPARTMENT &&
        String(complaint.departmentId) !== String(user.departmentId)
      ) {
        throw new ForbiddenException(ERROR_MSG.COMPLAINT.NOT_YOUR_DEPARTMENT);
      }

      if (dto.status === ComplaintStatus.RESOLVED && !dto.resolutionNote?.comment) {
        throw new BadRequestException(ERROR_MSG.COMPLAINT.RESOLUTION_NOTE_REQUIRED);
      }

      const now = new Date();
      complaint.status = dto.status;
      complaint.statusHistory.push({
        status: dto.status,
        note: dto.note,
        at: now,
        byUserId: new Types.ObjectId(currentUserId),
      });

      if (dto.status === ComplaintStatus.RESOLVED) {
        complaint.resolvedBy = new Types.ObjectId(currentUserId);
        complaint.resolvedAt = now;
        complaint.resolutionNote = {
          comment: dto.resolutionNote.comment,
          imageUrl: dto.resolutionNote.imageUrl,
        };
      }

      await complaint.save(); // .save() so the severityRank pre-save hook stays consistent

      const [citizen, department] = await Promise.all([
        this.userRepository.findUserById(String(complaint.citizenId)),
        this.departmentRepository.findById(String(complaint.departmentId)),
      ]);
      this.sendStatusSms(citizen?.phone, dto.status, complaint.ticketId, department?.name ?? '');

      return new ResponseResult({ message: SUCCESS_MSG.COMPLAINT.STATUS_UPDATED, data: complaint });
    } catch (error) {
      handleError(error);
    }
  }

  /**
   * Reassign a complaint to a different department (department/admin only).
   * A department user may only reassign complaints currently routed to their own department.
   */
  async reassignDepartment(id: string, dto: ReassignDepartmentDto, currentUserId: string) {
    try {
      const user = await this.userRepository.findUserById(currentUserId);
      if (!user) {
        throw new ForbiddenException(ERROR_MSG.COMPLAINT.NOT_YOUR_DEPARTMENT);
      }

      const complaint = await this.complaintRepository.findDocById(id);
      if (!complaint) {
        throw new NotFoundException(ERROR_MSG.COMPLAINT.NOT_FOUND);
      }

      if (
        user.role === UserRole.DEPARTMENT &&
        String(complaint.departmentId) !== String(user.departmentId)
      ) {
        throw new ForbiddenException(ERROR_MSG.COMPLAINT.NOT_YOUR_DEPARTMENT);
      }

      if (String(complaint.departmentId) === dto.departmentId) {
        throw new BadRequestException(ERROR_MSG.COMPLAINT.SAME_DEPARTMENT);
      }

      const targetDepartment = await this.departmentRepository.findById(dto.departmentId);
      if (!targetDepartment?.isActive) {
        throw new NotFoundException(ERROR_MSG.COMPLAINT.DEPARTMENT_NOT_FOUND);
      }

      complaint.departmentId = new Types.ObjectId(dto.departmentId);
      complaint.statusHistory.push({
        status: complaint.status,
        note: dto.note,
        at: new Date(),
        byUserId: new Types.ObjectId(currentUserId),
      });

      await complaint.save();

      return new ResponseResult({ message: SUCCESS_MSG.COMPLAINT.REASSIGNED, data: complaint });
    } catch (error) {
      handleError(error);
    }
  }

  /** Map the AI's severity string onto the enum, defaulting to Medium if missing/invalid. */
  private resolveSeverity(value?: string): ComplaintSeverity {
    const allowed = Object.values(ComplaintSeverity) as string[];
    return allowed.includes(value ?? '') ? (value as ComplaintSeverity) : ComplaintSeverity.MEDIUM;
  }

  async submitFeedback(id: string, dto: SubmitFeedbackDto, citizenId: string) {
    try {
      const complaint = await this.complaintRepository.findDocById(id);
      if (!complaint) {
        throw new NotFoundException(ERROR_MSG.COMPLAINT.NOT_FOUND);
      }

      if (String(complaint.citizenId) !== citizenId) {
        throw new ForbiddenException(ERROR_MSG.COMPLAINT.NOT_YOUR_COMPLAINT);
      }

      if (complaint.status !== ComplaintStatus.RESOLVED) {
        throw new BadRequestException(ERROR_MSG.COMPLAINT.COMPLAINT_NOT_RESOLVED);
      }

      if (complaint.feedback) {
        throw new BadRequestException(ERROR_MSG.COMPLAINT.FEEDBACK_ALREADY_SUBMITTED);
      }

      complaint.feedback = { rating: dto.rating, comment: dto.comment, submittedAt: new Date() };
      await complaint.save();

      return new ResponseResult({
        message: SUCCESS_MSG.COMPLAINT.FEEDBACK_SUBMITTED,
        data: complaint,
      });
    } catch (error) {
      handleError(error);
    }
  }

  async findByTicketId(ticketId: string) {
    try {
      const complaint = await this.complaintRepository.findByTicketId(ticketId);
      if (!complaint) {
        throw new NotFoundException(ERROR_MSG.COMPLAINT.NOT_FOUND);
      }
      return new ResponseResult({ message: SUCCESS_MSG.COMPLAINT.FETCHED, data: complaint });
    } catch (error) {
      handleError(error);
    }
  }

  async findById(id: string) {
    try {
      const complaint = await this.complaintRepository.findById(id);
      if (!complaint) {
        throw new NotFoundException(ERROR_MSG.COMPLAINT.NOT_FOUND);
      }
      return new ResponseResult({ message: SUCCESS_MSG.COMPLAINT.FETCHED, data: complaint });
    } catch (error) {
      handleError(error);
    }
  }

  async getAllGps() {
    try {
      const results = await this.complaintRepository.findAllGps();
      const coordinates = results.map(r => {
        const gps = r.gps as { lat: number; lng: number };
        return [gps.lat, gps.lng] as [number, number];
      });
      return new ResponseResult({ message: SUCCESS_MSG.COMPLAINT.GPS_FETCHED, data: coordinates });
    } catch (error) {
      handleError(error);
    }
  }
}
