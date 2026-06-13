import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ComplaintService } from '../../../core/services/complaint';
import { Complaint, ComplaintStatus } from '../../../core/models/complaint.model';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { StatusChip } from '../../../shared/components/status-chip/status-chip';
import { SeverityBadge } from '../../../shared/components/severity-badge/severity-badge';

const STATUS_STEPS: ComplaintStatus[] = ['submitted', 'under_review', 'in_progress', 'resolved'];

@Component({
  selector: 'app-ticket-tracker',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, Navbar, StatusChip, SeverityBadge],
  templateUrl: './ticket-tracker.html',
})
export class TicketTracker {
  private readonly complaintSvc = inject(ComplaintService);
  private readonly route = inject(ActivatedRoute);

  private readonly _ticketId = signal('');

  get ticketId(): string { return this._ticketId(); }
  set ticketId(v: string) { this._ticketId.set(v); }

  protected readonly ticketIdSignal = this._ticketId;
  readonly complaint = signal<Complaint | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly copied = signal(false);
  readonly zoomImage = signal(false);

  protected readonly statusSteps = STATUS_STEPS;

  protected readonly isRejected = computed(() => this.complaint()?.status === 'rejected');

  protected readonly currentStepIndex = computed(() => {
    const status = this.complaint()?.status;
    if (!status || status === 'rejected') return -1;
    return STATUS_STEPS.indexOf(status);
  });

  constructor() {
    // Pre-fill from query param if present
    this.route.queryParams.subscribe(params => {
      const id = params['id'] as string | undefined;
      if (id) {
        this._ticketId.set(id);
        this.search();
      }
    });
  }

  protected search(): void {
    const id = this._ticketId().trim();
    if (!id) return;
    this.isLoading.set(true);
    this.error.set(null);
    this.complaint.set(null);

    this.complaintSvc.getComplaintByTicketId(id).subscribe({
      next: c => { this.complaint.set(c); this.isLoading.set(false); },
      error: () => {
        this.isLoading.set(false);
        this.error.set(`No complaint found for ticket ID "${id}". Please check and try again.`);
      },
    });
  }

  protected copyTicketId(): void {
    const id = this.complaint()?.ticketId ?? this._ticketId();
    if (!id) return;
    navigator.clipboard.writeText(id).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }).catch(() => { /* clipboard unavailable */ });
  }

  protected stepLabel(status: ComplaintStatus): string {
    const labels: Record<ComplaintStatus, string> = {
      submitted: 'Submitted',
      under_review: 'Under Review',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      rejected: 'Rejected',
    };
    return labels[status];
  }

  protected stepIndex(status: ComplaintStatus): number {
    return STATUS_STEPS.indexOf(status);
  }

  protected openMap(lat: number, lng: number): void {
    window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}`, '_blank', 'noopener,noreferrer');
  }
}
