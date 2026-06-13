import { Component, inject, signal, computed, OnInit, PLATFORM_ID, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { ComplaintService } from '../../../core/services/complaint';
import { Complaint, ComplaintStatus } from '../../../core/models/complaint.model';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { StatusChip } from '../../../shared/components/status-chip/status-chip';
import { SeverityBadge } from '../../../shared/components/severity-badge/severity-badge';

const UPDATABLE_STATUSES: Array<{ value: ComplaintStatus; label: string }> = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
];

@Component({
  selector: 'app-complaint-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, Sidebar, StatusChip, SeverityBadge],
  templateUrl: './complaint-detail.html',
})
export class ComplaintDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly complaintSvc = inject(ComplaintService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly complaint = signal<Complaint | null>(null);
  readonly isLoading = signal(true);
  readonly notFound = signal(false);
  readonly selectedStatus = signal<ComplaintStatus | null>(null);
  readonly isUpdating = signal(false);
  readonly updateSuccess = signal(false);
  readonly showRejectConfirm = signal(false);
  readonly zoomImage = signal(false);

  protected readonly statusOptions = UPDATABLE_STATUSES;

  private rejectConfirmTimer: ReturnType<typeof setTimeout> | null = null;
  protected readonly sidebarRef = viewChild(Sidebar);
  protected openMobileNav(): void { this.sidebarRef()?.openMobileSidebar(); }

  protected readonly isResolved = computed(() => this.complaint()?.status === 'resolved');
  protected readonly isRejected = computed(() => this.complaint()?.status === 'rejected');
  protected readonly selectedIsReject = computed(() => this.selectedStatus() === 'rejected');

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'] as string;
      this.loadComplaint(id);
    });
  }

  private loadComplaint(id: string): void {
    this.isLoading.set(true);
    this.notFound.set(false);
    this.complaintSvc.getComplaintById(id).subscribe({
      next: c => {
        this.complaint.set(c);
        this.selectedStatus.set(c.status);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notFound.set(true);
      },
    });
  }

  protected selectStatus(status: ComplaintStatus): void {
    this.selectedStatus.set(status);
    // Clear any pending reject confirm if changing selection
    if (status !== 'rejected') {
      this.showRejectConfirm.set(false);
      if (this.rejectConfirmTimer) clearTimeout(this.rejectConfirmTimer);
    }
  }

  protected applyStatus(): void {
    const status = this.selectedStatus();
    const id = this.complaint()?.id;
    if (!status || !id) return;

    if (status === 'rejected') {
      // Two-step: show confirm button, auto-clear after 3s
      this.showRejectConfirm.set(true);
      if (this.rejectConfirmTimer) clearTimeout(this.rejectConfirmTimer);
      this.rejectConfirmTimer = setTimeout(() => this.showRejectConfirm.set(false), 3000);
      return;
    }

    this.submitUpdate(id, status);
  }

  protected confirmReject(): void {
    const id = this.complaint()?.id;
    if (!id) return;
    if (this.rejectConfirmTimer) clearTimeout(this.rejectConfirmTimer);
    this.showRejectConfirm.set(false);
    this.submitUpdate(id, 'rejected');
  }

  private submitUpdate(id: string, status: ComplaintStatus): void {
    this.isUpdating.set(true);
    this.updateSuccess.set(false);
    this.complaintSvc.updateStatus(id, status).subscribe({
      next: () => {
        this.isUpdating.set(false);
        this.updateSuccess.set(true);
        this.complaint.update(c => c ? { ...c, status } : null);
        setTimeout(() => this.updateSuccess.set(false), 4000);
      },
      error: () => { this.isUpdating.set(false); },
    });
  }

  protected openMap(lat: number, lng: number): void {
    if (isPlatformBrowser(this.platformId)) {
      window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}`, '_blank', 'noopener,noreferrer');
    }
  }

  protected goBack(): void {
    this.router.navigate(['/admin/queue']);
  }
}
