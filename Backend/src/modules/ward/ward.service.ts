import { Injectable } from '@nestjs/common';
import { handleError } from '../../common/utils';
import { ResponseResult } from '../../core/class';
import { loadWards, SUCCESS_MSG } from './ward.constants';
import { WardRepository } from './ward.repository';

@Injectable()
export class WardService {
  constructor(private readonly wardRepository: WardRepository) {}

  async seedDefaultWards() {
    try {
      const count = await this.wardRepository.countDocuments();
      if (count > 0) {
        return new ResponseResult({
          message: SUCCESS_MSG.ALREADY_EXISTS,
          data: await this.wardRepository.findAll(),
        });
      }
      const wards = await this.wardRepository.insertMany(loadWards());
      return new ResponseResult({ message: SUCCESS_MSG.SEED, data: wards });
    } catch (error) {
      handleError(error);
    }
  }

  /** Resolve the ward containing a GPS point; returns null if none match. */
  findByPoint(lat: number, lng: number) {
    return this.wardRepository.findByPoint(lat, lng);
  }
}
