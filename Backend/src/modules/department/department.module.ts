import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DepartmentController } from './department.controller';
import { DepartmentRepository } from './department.repository';
import { Department, DepartmentSchema } from './schemas/department.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Department.name, schema: DepartmentSchema }])],
  controllers: [DepartmentController],
  providers: [DepartmentRepository],
  exports: [DepartmentRepository],
})
export class DepartmentModule {}
