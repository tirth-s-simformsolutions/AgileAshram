import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Complaint, ComplaintDocument } from './schemas/complaint.schema';

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
      .sort({ severityRank: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  count(filter: FilterQuery<ComplaintDocument>) {
    return this.complaintModel.countDocuments(filter).exec();
  }

  findByTicketId(ticketId: string) {
    return this.complaintModel.findOne({ ticketId }).populate('departmentId').exec();
  }

  findById(id: string) {
    return this.complaintModel.findById(id).populate('departmentId').exec();
  }

  /** Hydrated (non-populated) doc for mutation — so .save() runs the pre-save hook. */
  findDocById(id: string) {
    return this.complaintModel.findById(id).exec();
  }

  /** Returns lat/lng for all complaints that have a GPS point set. */
  findAllGps() {
    return this.complaintModel
      .find({ gps: { $exists: true, $ne: null } }, { 'gps.lat': 1, 'gps.lng': 1, _id: 0 })
      .lean()
      .exec();
  }
}
