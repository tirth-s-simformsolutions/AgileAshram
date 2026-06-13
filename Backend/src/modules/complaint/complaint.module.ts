import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiModule } from '../ai/ai.module';
import { CounterModule } from '../counter/counter.module';
import { DepartmentModule } from '../department/department.module';
import { SmsModule } from '../sms/sms.module';
import { UserModule } from '../user/user.module';
import { WardModule } from '../ward/ward.module';
import { ComplaintController } from './complaint.controller';
import { ComplaintRepository } from './complaint.repository';
import { ComplaintService } from './complaint.service';
import { Complaint, ComplaintSchema } from './schemas/complaint.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Complaint.name, schema: ComplaintSchema }]),
    AiModule, // exports AiService (validate + suggest)
    CounterModule, // exports CounterService (ticket ids)
    DepartmentModule, // exports DepartmentRepository (fallback routing)
    UserModule, // exports UserRepository (role-scoped listing)
    SmsModule, // exports SmsService (status notifications)
    WardModule, // exports WardService (gps -> ward resolution)
  ],
  controllers: [ComplaintController],
  providers: [ComplaintService, ComplaintRepository],
  exports: [ComplaintRepository],
})
export class ComplaintModule {}
