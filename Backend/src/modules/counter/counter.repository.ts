import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter, CounterDocument } from './schemas/counter.schema';

@Injectable()
export class CounterRepository {
  constructor(@InjectModel(Counter.name) private readonly counterModel: Model<CounterDocument>) {}

  /** Atomically bump and return the counter for a key (creates it at 1 if absent). */
  increment(key: string) {
    return this.counterModel
      .findOneAndUpdate({ key }, { $inc: { seq: 1 } }, { upsert: true, new: true })
      .exec();
  }
}
