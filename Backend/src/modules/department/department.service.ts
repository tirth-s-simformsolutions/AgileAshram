import { Injectable } from '@nestjs/common';
import { handleError } from '../../common/utils';
import { ResponseResult } from '../../core/class';
import { PaginationWithSearchDto } from '../../common/dtos';
import { SUCCESS_MSG } from './messages';
import { DepartmentRepository } from './department.repository';

@Injectable()
export class DepartmentService {
  constructor(private readonly departmentRepository: DepartmentRepository) {}

  async list({ page, pageSize, search }: PaginationWithSearchDto) {
    try {
      const skip = page * pageSize;
      const [departments, total] = await Promise.all([
        this.departmentRepository.findAll(skip, pageSize, search),
        this.departmentRepository.countDocuments(search),
      ]);

      return new ResponseResult({
        message: SUCCESS_MSG.GET_DEPARTMENTS_LIST,
        data: {
          departments,
          total,
          page,
          pageSize,
        },
      });
    } catch (error) {
      handleError(error);
    }
  }
}
