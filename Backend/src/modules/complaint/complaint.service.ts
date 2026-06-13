import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { handleError } from '../../common/utils';
import { ResponseResult } from '../../core/class';
import { AiService } from '../ai/ai.service';
import { CounterService } from '../counter/counter.service';
import { DepartmentRepository } from '../department/department.repository';
import { ComplaintRepository } from './complaint.repository';
import { CreateComplaintDto } from './dtos';
import { ERROR_MSG, SUCCESS_MSG } from './messages';
import { ComplaintSeverity, ComplaintStatus } from './schemas/complaint.schema';

/** Shapes returned inside the AiService ResponseResult.data payloads. */
interface ValidationData {
  isLegit: boolean;
  reason?: string;
  imageAnalysis?: { isValid: boolean; reason?: string };
}
interface SuggestionData {
  industryId: string | null;
  summary: string;
}

@Injectable()
export class ComplaintService {
  constructor(
    private readonly complaintRepository: ComplaintRepository,
    private readonly aiService: AiService,
    private readonly counterService: CounterService,
    private readonly departmentRepository: DepartmentRepository,
  ) {}

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

      // 3. Human-readable ticket id (atomic).
      const ticketId = await this.counterService.nextTicketId();

      // 4. Persist (severityRank is derived from severity by the schema pre-save hook).
      const now = new Date();
      const complaint = await this.complaintRepository.create({
        ticketId,
        citizenId: new Types.ObjectId(citizenId),
        description: dto.description,
        imageUrl: dto.imageUrl,
        departmentId: new Types.ObjectId(departmentId),
        severity: ComplaintSeverity.MEDIUM, // TODO: source severity from AI scoring
        gps: { lat: dto.location.lat, lng: dto.location.lng },
        reportedAddress: dto.location.address,
        status: ComplaintStatus.ROUTED,
        aiMeta: {
          model: 'gemini',
          confidence: 0,
          rawLabel: suggestion?.summary,
          fallbackUsed: false,
        },
        statusHistory: [
          { status: ComplaintStatus.SUBMITTED, at: now },
          { status: ComplaintStatus.ROUTED, at: now },
        ],
      });

      return new ResponseResult({ message: SUCCESS_MSG.COMPLAINT.CREATED, data: complaint });
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
}
