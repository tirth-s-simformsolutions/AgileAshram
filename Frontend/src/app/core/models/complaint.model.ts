export type ComplaintCategory = 'infrastructure' | 'sanitation' | 'water' | 'electricity' | 'road' | 'other';
export type ComplaintSeverity = 'low' | 'medium' | 'high' | 'critical';
// Matches backend enum exactly (PATCH /complaints/:id/status validates against these).
export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export interface Location { lat: number; lng: number; address?: string; }

export interface Complaint {
  id?: string;
  ticketId?: string;
  description: string;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  status: ComplaintStatus;
  department: string; // department name from the API (e.g. "Garbage / Waste Management Department")
  location: Location;
  imageUrl?: string;
  citizenName?: string;
  citizenPhone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateComplaintDto {
  description: string;
  imageUrl: string;
  location: Location;
}

// POST /api/v1/complaints response payload — backend AI-routes + grades on submit.
export interface SubmittedComplaint {
  _id: string;
  ticketId: string;
  description: string;
  imageUrl?: string;
  departmentId?: { _id: string; name: string };
  severity: string;
  status: string;
  reportedAddress?: string;
  createdAt?: string;
}

export interface PresignedUrlResponse {
  presignedUrl: string;
  key: string;
  publicUrl: string;
  expiresAt: string;
}

// Raw AI routing suggestion from POST /api/v1/ai/suggest-industries.
// industryId is a Department _id, or null when confidence is low.
export interface AiSuggestion {
  industryId: string | null;
  summary: string;
  severity: string;
}

export interface DepartmentItem {
  _id: string;
  name: string;
  responsibilities?: string[];
  keywords?: string[];
  contactEmail?: string;
  isActive?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  timestamp?: Date;
  imageUrl?: string;
}
