import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DepartmentController } from './department.controller';
import { DepartmentRepository } from './department.repository';
import { Department, DepartmentSchema } from './schemas/department.schema';
import { DepartmentService } from './department.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Department.name, schema: DepartmentSchema }])],
  controllers: [DepartmentController],
  providers: [DepartmentRepository, DepartmentService],
  exports: [DepartmentRepository],
})
export class DepartmentModule {}
