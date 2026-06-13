import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Complaint, ComplaintStatus, CreateComplaintDto, PresignedUrlResponse, SubmittedComplaint
} from '../models/complaint.model';

interface ComplaintListResponse {
  complaints: Complaint[];
  total: number;
  page: number;
  pageSize: number;
}

interface StatusUpdateResponse {
  id: string;
  status: ComplaintStatus;
  updatedAt: Date;
}

@Injectable({ providedIn: 'root' })
export class ComplaintService {
  private readonly http = inject(HttpClient);

  getPresignedUrl(filename: string, contentType: string): Observable<{ data: PresignedUrlResponse }> {
    return this.http.post<{ data: PresignedUrlResponse }>(
      '/api/v1/upload/presigned-url',
      { filename, contentType }
    );
  }

  uploadToStorage(presignedUrl: string, file: File): Observable<void> {
    return this.http.put(presignedUrl, file, {
      headers: { 'Content-Type': file.type },
      responseType: 'text' as 'json',
    }).pipe(map(() => undefined));
  }

  submitComplaint(dto: CreateComplaintDto): Observable<{ data: SubmittedComplaint }> {
    return this.http.post<{ data: SubmittedComplaint }>('/api/v1/complaints', dto);
  }

  getComplaints(filters?: Record<string, string>): Observable<ComplaintListResponse> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        params = params.set(key, value);
      });
    }
    return this.http.get<ComplaintListResponse>('/api/v1/complaints', { params });
  }

  getComplaintById(id: string): Observable<Complaint> {
    return this.http.get<Complaint>(`/api/v1/complaints/${id}`);
  }

  getComplaintByTicketId(ticketId: string): Observable<Complaint> {
    return this.http.get<Complaint>(`/api/v1/complaints/ticket/${ticketId}`);
  }

  updateStatus(id: string, status: ComplaintStatus): Observable<StatusUpdateResponse> {
    return this.http.patch<StatusUpdateResponse>(`/api/v1/complaints/${id}/status`, { status });
  }
}
