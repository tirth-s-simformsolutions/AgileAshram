import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Complaint, ComplaintStatus } from '../models/complaint.model';

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

  /**
   * Submit a new complaint with optional image attachment.
   * The FormData must include all required Complaint fields plus
   * an optional `image` File entry.
   */
  submitComplaint(formData: FormData): Observable<Complaint> {
    return this.http.post<Complaint>('/api/complaints', formData);
  }

  /**
   * Retrieve a paginated list of complaints with optional filters.
   * Supported filter keys: status, category, department, page, pageSize.
   */
  getComplaints(filters?: Record<string, string>): Observable<ComplaintListResponse> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        params = params.set(key, value);
      });
    }
    return this.http.get<ComplaintListResponse>('/api/complaints', { params });
  }

  /**
   * Retrieve a single complaint by its MongoDB ObjectId.
   */
  getComplaintById(id: string): Observable<Complaint> {
    return this.http.get<Complaint>(`/api/complaints/${id}`);
  }

  /**
   * Retrieve a complaint by its human-readable ticket ID (e.g. NV-2024-00123).
   */
  getComplaintByTicketId(ticketId: string): Observable<Complaint> {
    return this.http.get<Complaint>(`/api/complaints/ticket/${ticketId}`);
  }

  /**
   * Update the status of a complaint. Admin-only in practice (enforced server-side).
   */
  updateStatus(id: string, status: ComplaintStatus): Observable<StatusUpdateResponse> {
    return this.http.patch<StatusUpdateResponse>(`/api/complaints/${id}/status`, { status });
  }
}
