import { Injectable } from '@nestjs/common';
import { handleError } from '../../common/utils';
import { ResponseResult } from '../../core/class';
import { SUCCESS_MSG } from './messages';
import { DepartmentRepository } from './department.repository';

@Injectable()
export class DepartmentService {
  constructor(private readonly departmentRepository: DepartmentRepository) {}

  async list() {
    try {
      const [departments, total] = await Promise.all([
        this.departmentRepository.findAll(),
        this.departmentRepository.countDocuments(),
      ]);

      return new ResponseResult({
        message: SUCCESS_MSG.GET_DEPARTMENTS_LIST,
        data: {
          departments,
          total,
        },
      });
    } catch (error) {
      handleError(error);
    }
  }
}
