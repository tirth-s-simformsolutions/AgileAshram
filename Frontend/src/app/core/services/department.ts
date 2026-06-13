import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DepartmentItem } from '../models/complaint.model';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private readonly http = inject(HttpClient);

  getDepartments(): Observable<DepartmentItem[]> {
    return this.http
      .get<{ data: { departments: DepartmentItem[] } }>('/api/v1/department')
      .pipe(map(res => res.data?.departments ?? []));
  }
}
