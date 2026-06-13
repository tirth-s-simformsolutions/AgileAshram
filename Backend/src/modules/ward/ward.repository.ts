import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ward, WardDocument } from './schemas/ward.schema';

@Injectable()
export class WardRepository {
  constructor(@InjectModel(Ward.name) private readonly wardModel: Model<WardDocument>) {}

  insertMany(wards: Partial<Ward>[]) {
    return this.wardModel.insertMany(wards);
  }

  findAll() {
    return this.wardModel.find().exec();
  }

  countDocuments() {
    return this.wardModel.countDocuments().exec();
  }

  /** Ward whose boundary contains the given point (null if outside all wards). */
  findByPoint(lat: number, lng: number) {
    return this.wardModel
      .findOne({
        // GeoJSON Point coordinates are [lng, lat].
        boundary: { $geoIntersects: { $geometry: { type: 'Point', coordinates: [lng, lat] } } },
      })
      .exec();
  }
}
