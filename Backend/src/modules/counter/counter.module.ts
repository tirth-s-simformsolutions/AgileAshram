import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CounterRepository } from './counter.repository';
import { CounterService } from './counter.service';
import { Counter, CounterSchema } from './schemas/counter.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Counter.name, schema: CounterSchema }])],
  providers: [CounterService, CounterRepository],
  exports: [CounterService],
})
export class CounterModule {}
