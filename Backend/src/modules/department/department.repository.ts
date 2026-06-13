import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Department, DepartmentDocument } from './schemas/department.schema';

@Injectable()
export class DepartmentRepository {
  constructor(@InjectModel(Department.name) private readonly departmentModel: Model<DepartmentDocument>) {}

  insertMany(departments: Partial<Department>[]) {
    return this.departmentModel.insertMany(departments);
  }

  findAll() {
    return this.departmentModel.find().exec();
  }

  countDocuments() {
    return this.departmentModel.countDocuments().exec();
  }
}
