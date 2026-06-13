import { Injectable } from '@nestjs/common';
import { handleError } from '../../common/utils';
import { ResponseResult } from '../../core/class/';
import { DEFAULT_DEPARTMENTS } from './department.constants';
import { DepartmentRepository } from './department.repository';
import { ERROR_MSG, SUCCESS_MSG } from './messages';

@Injectable()
export class DepartmentService {
  constructor(private readonly departmentRepository: DepartmentRepository) {}

  async seedDefaultDepartments() {
    try {
      const count = await this.departmentRepository.countDocuments();

      if (count > 0) {
        return new ResponseResult({
          message: ERROR_MSG.ALREADY_EXISTS,
          data: await this.departmentRepository.findAll(),
        });
      }

      const departments = await this.departmentRepository.insertMany(DEFAULT_DEPARTMENTS);

      return new ResponseResult({
        message: SUCCESS_MSG.SEED,
        data: departments,
      });
    } catch (error) {
      handleError(error);
    }
  }
}
