import { model } from 'mongoose';
import { Department, DepartmentSchema } from './schemas/department.schema';

export const DepartmentModel = model<Department>('Department', DepartmentSchema);
