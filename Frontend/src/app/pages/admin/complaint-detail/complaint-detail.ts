import { Component, inject, signal, computed, OnInit, PLATFORM_ID, viewChild, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComplaintService } from '../../../core/services/complaint';
import { DepartmentService } from '../../../core/services/department';
import { Complaint, ComplaintStatus, DepartmentItem } from '../../../core/models/complaint.model';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { StatusChip } from '../../../shared/components/status-chip/status-chip';
import { SeverityBadge } from '../../../shared/components/severity-badge/severity-badge';
import { FileUpload } from '../../../shared/components/file-upload/file-upload';

const UPDATABLE_STATUSES: Array<{ value: ComplaintStatus; label: string }> = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'REJECTED', label: 'Rejected' },
];

@Component({
  selector: 'app-complaint-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule, Sidebar, StatusChip, SeverityBadge, FileUpload],
  templateUrl: './complaint-detail.html',
})
export class ComplaintDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly complaintSvc = inject(ComplaintService);
  private readonly departmentSvc = inject(DepartmentService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly complaint = signal<Complaint | null>(null);
  readonly isLoading = signal(true);
  readonly notFound = signal(false);
  readonly selectedStatus = signal<ComplaintStatus | null>(null);
  readonly isUpdating = signal(false);
  readonly updateSuccess = signal(false);
  readonly showRejectConfirm = signal(false);
  readonly zoomImage = signal(false);

  // Reassign department
  readonly departments = signal<DepartmentItem[]>([]);
  private readonly _targetDeptId = signal('');
  get targetDeptId(): string { return this._targetDeptId(); }
  set targetDeptId(v: string) { this._targetDeptId.set(v); }
  private readonly _reassignNote = signal('');
  get reassignNote(): string { return this._reassignNote(); }
  set reassignNote(v: string) { this._reassignNote.set(v); }
  readonly isReassigning = signal(false);
  readonly reassignSuccess = signal(false);
  readonly reassignError = signal<string | null>(null);

  // Other departments to reassign to (current one excluded).
  protected readonly otherDepartments = computed(() =>
    this.departments().filter(d => d._id !== this.complaint()?.departmentId),
  );
  protected readonly canReassign = computed(() =>
    !this.isReassigning() &&
    this._targetDeptId().length > 0 &&
    this._reassignNote().trim().length > 0,
  );

  // Action gate: a comment is mandatory for RESOLVED and REJECTED; RESOLVED also needs a proof photo.
  private readonly _comment = signal('');
  get comment(): string { return this._comment(); }
  set comment(v: string) { this._comment.set(v); }
  readonly resolveFile = signal<File | null>(null);

  protected readonly statusOptions = UPDATABLE_STATUSES;

  private rejectConfirmTimer: ReturnType<typeof setTimeout> | null = null;
  protected readonly sidebarRef = viewChild(Sidebar);
  protected openMobileNav(): void { this.sidebarRef()?.openMobileSidebar(); }

  protected readonly isResolved = computed(() => this.complaint()?.status === 'RESOLVED');
  protected readonly isRejected = computed(() => this.complaint()?.status === 'REJECTED');
  protected readonly selectedIsReject = computed(() => this.selectedStatus() === 'REJECTED');
  protected readonly selectedIsResolve = computed(() => this.selectedStatus() === 'RESOLVED');

  // Apply is blocked until: RESOLVED has a comment + photo, REJECTED has a comment.
  protected readonly canApply = computed(() => {
    if (this.isUpdating()) return false;
    if (!this.selectedStatus()) return false;
    const hasComment = this._comment().trim().length > 0;
    if (this.selectedIsResolve()) return hasComment && this.resolveFile() !== null;
    if (this.selectedIsReject()) return hasComment;
    return true;
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'] as string;
      this.loadComplaint(id);
    });
    this.departmentSvc.getDepartments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: list => this.departments.set(list), error: () => {} });
  }

  protected reassign(): void {
    const id = this.complaint()?.id;
    const deptId = this._targetDeptId();
    const note = this._reassignNote().trim();
    if (!id || !deptId || !note || this.isReassigning()) return;

    this.isReassigning.set(true);
    this.reassignSuccess.set(false);
    this.reassignError.set(null);
    this.complaintSvc.reassignDepartment(id, deptId, note).subscribe({
      next: () => {
        this.isReassigning.set(false);
        this.reassignSuccess.set(true);
        // Response isn't populated — reflect the chosen department locally.
        const dept = this.departments().find(d => d._id === deptId);
        this.complaint.update(c => c ? { ...c, departmentId: deptId, department: dept?.name ?? c.department } : null);
        this._targetDeptId.set('');
        this._reassignNote.set('');
        setTimeout(() => this.reassignSuccess.set(false), 4000);
      },
      error: () => {
        this.isReassigning.set(false);
        this.reassignError.set('Could not reassign. Please try again.');
      },
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
    if (status !== 'REJECTED') {
      this.showRejectConfirm.set(false);
      if (this.rejectConfirmTimer) clearTimeout(this.rejectConfirmTimer);
    }
    // Comment only applies to RESOLVED/REJECTED; the photo only to RESOLVED. Drop what no longer applies.
    if (status !== 'RESOLVED' && status !== 'REJECTED') this._comment.set('');
    if (status !== 'RESOLVED') this.resolveFile.set(null);
  }

  protected onResolveFileChange(file: File | null): void {
    this.resolveFile.set(file);
  }

  protected applyStatus(): void {
    const status = this.selectedStatus();
    const id = this.complaint()?.id;
    if (!status || !id) return;

    if (status === 'REJECTED') {
      // Two-step: show confirm button, auto-clear after 3s
      this.showRejectConfirm.set(true);
      if (this.rejectConfirmTimer) clearTimeout(this.rejectConfirmTimer);
      this.rejectConfirmTimer = setTimeout(() => this.showRejectConfirm.set(false), 3000);
      return;
    }

    if (status === 'RESOLVED') {
      this.submitResolve(id);
      return;
    }

    this.submitUpdate(id, status);
  }

  protected confirmReject(): void {
    const id = this.complaint()?.id;
    if (!id) return;
    if (this.rejectConfirmTimer) clearTimeout(this.rejectConfirmTimer);
    this.showRejectConfirm.set(false);
    this.submitUpdate(id, 'REJECTED', this._comment().trim());
  }

  private submitUpdate(id: string, status: ComplaintStatus, note?: string): void {
    this.isUpdating.set(true);
    this.updateSuccess.set(false);
    this.complaintSvc.updateStatus(id, status, note).subscribe({
      next: () => {
        this.isUpdating.set(false);
        this.updateSuccess.set(true);
        this.complaint.update(c => c ? { ...c, status } : null);
        this._comment.set('');
        setTimeout(() => this.updateSuccess.set(false), 4000);
      },
      error: () => { this.isUpdating.set(false); },
    });
  }

  // RESOLVED requires proof: upload the photo, then PATCH with the comment as the note
  // (the photo URL is folded into the note since the status endpoint has no image field).
  private submitResolve(id: string): void {
    const comment = this._comment().trim();
    const file = this.resolveFile();
    if (!comment || !file) return;

    this.isUpdating.set(true);
    this.updateSuccess.set(false);
    this.complaintSvc.getPresignedUrl(file.name, file.type).pipe(
      switchMap(res => {
        const photoUrl = res.data.publicUrl;
        const note = `${comment}\n\n[Resolution photo] ${photoUrl}`;
        return this.complaintSvc.uploadToStorage(res.data.presignedUrl, file).pipe(
          switchMap(() => this.complaintSvc.updateStatus(id, 'RESOLVED', note)),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.isUpdating.set(false);
        this.updateSuccess.set(true);
        this.complaint.update(c => c ? { ...c, status: 'RESOLVED' } : null);
        this._comment.set('');
        this.resolveFile.set(null);
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
