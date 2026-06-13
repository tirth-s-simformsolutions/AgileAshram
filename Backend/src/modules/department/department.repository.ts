import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Department, DepartmentDocument } from './schemas/department.schema';

@Injectable()
export class DepartmentRepository {
  constructor(
    @InjectModel(Department.name) private readonly departmentModel: Model<DepartmentDocument>,
  ) {}

  insertMany(departments: Partial<Department>[]) {
    return this.departmentModel.insertMany(departments);
  }

  findAll(skip = 0, limit = 0, search = '') {
    const filter = search ? { name: { $regex: search, $options: 'i' } } : {};
    const query = this.departmentModel.find(filter).select('_id name').skip(skip);
    if (limit > 0) query.limit(limit);
    return query.exec();
  }

  countDocuments(search = '') {
    const filter = search ? { name: { $regex: search, $options: 'i' } } : {};
    return this.departmentModel.countDocuments(filter).exec();
  }

  findById(id: string) {
    return this.departmentModel.findById(id).exec();
  }
}
