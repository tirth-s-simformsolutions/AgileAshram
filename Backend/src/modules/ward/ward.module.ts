import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Ward, WardSchema } from './schemas/ward.schema';
import { WardController } from './ward.controller';
import { WardRepository } from './ward.repository';
import { WardService } from './ward.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Ward.name, schema: WardSchema }])],
  controllers: [WardController],
  providers: [WardService, WardRepository],
  exports: [WardService],
})
export class WardModule {}
