import { Module } from '@nestjs/common';
import { DepartmentModule } from '../department/department.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [DepartmentModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
