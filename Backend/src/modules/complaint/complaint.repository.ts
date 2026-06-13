import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

  findByTicketId(ticketId: string) {
    return this.complaintModel.findOne({ ticketId }).populate('departmentId').exec();
  }

  findById(id: string) {
    return this.complaintModel.findById(id).populate('departmentId').exec();
  }
}
