export type ComplaintCategory = 'infrastructure' | 'sanitation' | 'water' | 'electricity' | 'road' | 'other';
export type ComplaintSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ComplaintStatus = 'submitted' | 'under_review' | 'in_progress' | 'resolved' | 'rejected';
export type Department = 'infrastructure' | 'sanitation';

export interface Location { lat: number; lng: number; address?: string; }

export interface Complaint {
  id?: string;
  ticketId?: string;
  description: string;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  status: ComplaintStatus;
  department: Department;
  location: Location;
  imageUrl?: string;
  citizenName?: string;
  citizenPhone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  timestamp?: Date;
  imageUrl?: string;
}

export interface GeminiClassification {
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  department: Department;
  summary: string;
}
