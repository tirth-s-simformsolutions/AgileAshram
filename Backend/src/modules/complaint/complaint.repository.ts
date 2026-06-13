import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Complaint, ComplaintDocument, ComplaintStatus } from './schemas/complaint.schema';

@Injectable()
export class ComplaintRepository {
  constructor(
    @InjectModel(Complaint.name) private readonly complaintModel: Model<ComplaintDocument>,
  ) {}

  /** Use create() (not insertMany) so the severityRank pre-save hook runs. */
  create(data: Partial<Complaint>) {
    return this.complaintModel.create(data);
  }

  /** Paginated list, highest severity first, newest first. */
  list(filter: FilterQuery<ComplaintDocument>, skip: number, limit: number) {
    return this.complaintModel
      .find(filter)
      .populate('departmentId')
      .populate({ path: 'wardId', select: 'number name zone' })
      .sort({ severityRank: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  count(filter: FilterQuery<ComplaintDocument>) {
    return this.complaintModel.countDocuments(filter).exec();
  }

  findByTicketId(ticketId: string) {
    return this.complaintModel
      .findOne({ ticketId })
      .populate('departmentId')
      .populate({ path: 'wardId', select: 'number name zone' })
      .exec();
  }

  findById(id: string) {
    return this.complaintModel
      .findById(id)
      .populate('departmentId')
      .populate({ path: 'wardId', select: 'number name zone' })
      .exec();
  }

  /** Hydrated (non-populated) doc for mutation — so .save() runs the pre-save hook. */
  findDocById(id: string) {
    return this.complaintModel.findById(id).exec();
  }

  /**
   * Returns unresolved complaints for a department that have GPS coordinates and a
   * classified context (aiMeta.rawLabel set). Used for nearby-duplicate detection.
   */
  findUnresolvedByDepartment(departmentId: Types.ObjectId) {
    return this.complaintModel
      .find({
        departmentId,
        status: { $in: [ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS] },
        'gps.lat': { $exists: true },
        'gps.lng': { $exists: true },
        'aiMeta.rawLabel': { $exists: true, $not: { $in: [null, ''] } },
      })
      .select('gps ticketId description reportedAddress dueDate aiMeta.rawLabel');
  }

  findAllGps(filter: FilterQuery<ComplaintDocument> = {}) {
    return this.complaintModel
      .find(
        { ...filter, gps: { $exists: true, $ne: null } },
        { 'gps.lat': 1, 'gps.lng': 1, _id: 0 },
      )
      .lean()
      .limit(25)
      .exec();
  }
}
