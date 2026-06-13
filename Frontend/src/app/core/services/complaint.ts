import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Complaint, ComplaintCategory, ComplaintSeverity, ComplaintStatus,
  CreateComplaintDto, PresignedUrlResponse, SubmittedComplaint
} from '../models/complaint.model';

// ---------------------------------------------------------------------------
// Raw API shapes (backend) — mapped to the FE Complaint model below.
// ---------------------------------------------------------------------------
interface RawComplaint {
  _id: string;
  ticketId?: string;
  description: string;
  imageUrl?: string;
  departmentId?: { _id: string; name: string };
  severity?: string;          // "Low" | "Medium" | "High" | "Critical"
  severityRank?: number;
  gps?: { lat: number; lng: number };
  reportedAddress?: string;
  status?: string;            // "OPEN" | "IN_PROGRESS" | "RESOLVED" | "REJECTED"
  citizenName?: string;
  citizenPhone?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface RawListData {
  complaints: RawComplaint[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ComplaintListResponse {
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

  // Normalise a raw backend complaint into the FE Complaint model.
  private mapComplaint(raw: RawComplaint): Complaint {
    return {
      id: raw._id,
      ticketId: raw.ticketId,
      description: raw.description,
      category: 'other' as ComplaintCategory, // backend has no category field
      severity: (raw.severity ?? '').toLowerCase() as ComplaintSeverity,
      status: (raw.status as ComplaintStatus) ?? 'OPEN',
      department: raw.departmentId?.name ?? '',
      location: {
        lat: raw.gps?.lat ?? 0,
        lng: raw.gps?.lng ?? 0,
        address: raw.reportedAddress ?? '',
      },
      imageUrl: raw.imageUrl,
      citizenName: raw.citizenName,
      citizenPhone: raw.citizenPhone,
      createdAt: raw.createdAt ? new Date(raw.createdAt) : undefined,
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : undefined,
    };
  }

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
    return this.http
      .get<{ data: RawListData }>('/api/v1/complaints', { params })
      .pipe(map(res => ({
        complaints: (res.data?.complaints ?? []).map(c => this.mapComplaint(c)),
        total: res.data?.total ?? 0,
        page: res.data?.page ?? 0,
        pageSize: res.data?.pageSize ?? 0,
      })));
  }

  getComplaintById(id: string): Observable<Complaint> {
    return this.http
      .get<{ data: RawComplaint }>(`/api/v1/complaints/${id}`)
      .pipe(map(res => this.mapComplaint(res.data)));
  }

  getComplaintByTicketId(ticketId: string): Observable<Complaint> {
    return this.http
      .get<{ data: RawComplaint }>(`/api/v1/complaints/ticket/${ticketId}`)
      .pipe(map(res => this.mapComplaint(res.data)));
  }

  updateStatus(id: string, status: ComplaintStatus, note?: string): Observable<StatusUpdateResponse> {
    const body: { status: ComplaintStatus; note?: string } = { status };
    if (note?.trim()) body.note = note.trim();
    return this.http.patch<StatusUpdateResponse>(`/api/v1/complaints/${id}/status`, body);
  }

  // All complaint GPS coords for the hotspot map — API returns data: [[lat, lng], …].
  getGpsPoints(): Observable<Array<{ lat: number; lng: number }>> {
    return this.http
      .get<{ data: Array<[number | string, number | string]> }>('/api/v1/complaints/gps')
      .pipe(map(res => (res.data ?? [])
        .map(p => ({ lat: Number(p?.[0]), lng: Number(p?.[1]) }))
        .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng))));
  }
}
