import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ComplaintService } from '../../../core/services/complaint';
import { Complaint, ComplaintStatus } from '../../../core/models/complaint.model';
import { formatDuration, slaView } from '../../../core/utils/sla';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { StatusChip } from '../../../shared/components/status-chip/status-chip';
import { SeverityBadge } from '../../../shared/components/severity-badge/severity-badge';

const STATUS_STEPS: ComplaintStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

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
  readonly complaints = signal<Complaint[]>([]);
  readonly isLoading = signal(false);
  readonly listLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly listError = signal<string | null>(null);
  readonly copied = signal(false);
  readonly zoomImage = signal(false);

  // Feedback (citizen, resolved complaints only — one per complaint)
  private readonly _feedbackRating = signal(0);
  get feedbackRating(): number { return this._feedbackRating(); }
  set feedbackRating(v: number) { this._feedbackRating.set(v); }
  private readonly _feedbackComment = signal('');
  get feedbackComment(): string { return this._feedbackComment(); }
  set feedbackComment(v: string) { this._feedbackComment.set(v); }
  readonly feedbackSubmitting = signal(false);
  readonly feedbackError = signal<string | null>(null);

  protected readonly statusSteps = STATUS_STEPS;

  protected readonly isRejected = computed(() => this.complaint()?.status === 'REJECTED');
  protected readonly isResolved = computed(() => this.complaint()?.status === 'RESOLVED');

  // Time-left view for an open complaint (null when closed or no due date).
  protected readonly sla = computed(() => {
    const c = this.complaint();
    if (!c?.dueDate || c.status === 'RESOLVED' || c.status === 'REJECTED') return null;
    return slaView(c.dueDate instanceof Date ? c.dueDate : new Date(c.dueDate));
  });

  // "Resolved in 3 days 4 hrs" once a complaint is closed out.
  protected readonly resolutionTime = computed(() => {
    const c = this.complaint();
    if (!c?.createdAt || !c?.resolvedAt) return null;
    const created = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
    const resolved = c.resolvedAt instanceof Date ? c.resolvedAt : new Date(c.resolvedAt);
    return formatDuration(resolved.getTime() - created.getTime());
  });

  // Per-item SLA hint for the list view (null when closed or no due date).
  protected itemSla(c: Complaint) {
    if (!c.dueDate || c.status === 'RESOLVED' || c.status === 'REJECTED') return null;
    return slaView(c.dueDate instanceof Date ? c.dueDate : new Date(c.dueDate));
  }

  protected setRating(n: number): void { this._feedbackRating.set(n); }

  protected submitFeedback(): void {
    const c = this.complaint();
    const rating = this._feedbackRating();
    if (!c?.id || rating < 1 || this.feedbackSubmitting()) return;
    this.feedbackSubmitting.set(true);
    this.feedbackError.set(null);
    this.complaintSvc.submitFeedback(c.id, rating, this._feedbackComment()).subscribe({
      next: updated => {
        this.feedbackSubmitting.set(false);
        this.complaint.set(updated);
        // Keep the list copy in sync so re-opening shows the saved feedback.
        this.complaints.update(list => list.map(x => (x.id === updated.id ? updated : x)));
        this._feedbackRating.set(0);
        this._feedbackComment.set('');
      },
      error: () => {
        this.feedbackSubmitting.set(false);
        this.feedbackError.set('Could not submit your feedback. Please try again.');
      },
    });
  }

  protected readonly currentStepIndex = computed(() => {
    const status = this.complaint()?.status;
    if (!status || status === 'REJECTED') return -1;
    return STATUS_STEPS.indexOf(status);
  });

  constructor() {
    // A query-param id opens that ticket directly; otherwise list all the citizen's complaints.
    this.route.queryParams.subscribe(params => {
      const id = params['id'] as string | undefined;
      if (id) {
        this._ticketId.set(id);
        this.search();
      } else {
        this.loadAll();
      }
    });
  }

  private loadAll(): void {
    this.listLoading.set(true);
    this.listError.set(null);
    this.complaintSvc.getComplaints().subscribe({
      next: res => { this.complaints.set(res.complaints); this.listLoading.set(false); },
      error: () => {
        this.listLoading.set(false);
        this.listError.set('Could not load your complaints. Please try again.');
      },
    });
  }

  protected search(): void {
    const id = this._ticketId().trim();
    // Empty search → drop back to the full list.
    if (!id) { this.backToList(); return; }
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

  // Open a complaint from the list — data is already loaded, no refetch needed.
  protected viewComplaint(c: Complaint): void {
    this.complaint.set(c);
    this._ticketId.set(c.ticketId ?? '');
    this.error.set(null);
  }

  protected backToList(): void {
    this.complaint.set(null);
    this.error.set(null);
    this._ticketId.set('');
    if (!this.complaints().length) this.loadAll();
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
      OPEN: 'Open',
      IN_PROGRESS: 'In Progress',
      RESOLVED: 'Resolved',
      REJECTED: 'Rejected',
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
