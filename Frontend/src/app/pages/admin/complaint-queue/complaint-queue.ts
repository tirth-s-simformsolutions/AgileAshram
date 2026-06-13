import { Component, inject, signal, computed, OnInit, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ComplaintService } from '../../../core/services/complaint';
import { DepartmentService } from '../../../core/services/department';
import { AuthService } from '../../../core/services/auth';
import { Complaint, ComplaintStatus, DepartmentItem } from '../../../core/models/complaint.model';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { SeverityBadge } from '../../../shared/components/severity-badge/severity-badge';
import { StatusChip } from '../../../shared/components/status-chip/status-chip';

type FilterStatus = ComplaintStatus | 'all';

const STATUS_FILTERS: Array<{ value: FilterStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'OPEN', label: 'New' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'REJECTED', label: 'Rejected' },
];

@Component({
  selector: 'app-complaint-queue',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, Sidebar, SeverityBadge, StatusChip],
  templateUrl: './complaint-queue.html',
})
export class ComplaintQueue implements OnInit {
  private readonly complaintSvc = inject(ComplaintService);
  private readonly departmentSvc = inject(DepartmentService);
  private readonly authSvc = inject(AuthService);
  private readonly router = inject(Router);

  readonly complaints = signal<Complaint[]>([]);
  readonly departments = signal<DepartmentItem[]>([]);
  readonly isLoading = signal(true);
  readonly activeStatus = signal<FilterStatus>('all');
  // 'all' or a department name (matched against complaint.department by slug)
  readonly activeDepartment = signal<string>('all');
  readonly currentUser = this.authSvc.currentUser;

  private readonly _searchText = signal('');
  get searchText(): string { return this._searchText(); }
  set searchText(v: string) { this._searchText.set(v); }

  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly skeletonRows = Array.from({ length: 6 });
  protected readonly sidebarRef = viewChild(Sidebar);
  protected openMobileNav(): void { this.sidebarRef()?.openMobileSidebar(); }

  readonly visibleComplaints = computed(() => {
    let list = this.complaints();
    const status = this.activeStatus();
    const dept = this.activeDepartment();
    const search = this._searchText().toLowerCase().trim();
    if (status !== 'all') list = list.filter(c => c.status === status);
    if (dept !== 'all') {
      const target = this.normalizeDept(dept);
      list = list.filter(c => this.normalizeDept(c.department) === target);
    }
    if (search) {
      list = list.filter(c =>
        (c.ticketId ?? '').toLowerCase().includes(search) ||
        c.description.toLowerCase().includes(search) ||
        (c.citizenName ?? '').toLowerCase().includes(search)
      );
    }
    return list;
  });

  readonly stats = computed(() => {
    const all = this.complaints();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      total: all.length,
      critical: all.filter(c => c.severity === 'critical').length,
      inProgress: all.filter(c => c.status === 'IN_PROGRESS').length,
      resolvedToday: all.filter(c => {
        if (c.status !== 'RESOLVED' || !c.updatedAt) return false;
        return new Date(c.updatedAt) >= today;
      }).length,
    };
  });

  readonly noMatchingComplaints = computed(() =>
    !this.isLoading() && this.complaints().length > 0 && this.visibleComplaints().length === 0
  );

  readonly noComplaints = computed(() =>
    !this.isLoading() && this.complaints().length === 0
  );

  ngOnInit(): void {
    this.complaintSvc.getComplaints().subscribe({
      next: res => { this.complaints.set(res.complaints); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); },
    });
    // Populate the department filter — non-blocking; dropdown stays hidden on failure
    this.departmentSvc.getDepartments().subscribe({
      next: depts => this.departments.set(depts),
      error: () => {},
    });
  }

  protected setFilter(status: FilterStatus): void {
    this.activeStatus.set(status);
  }

  protected setDepartment(name: string): void {
    this.activeDepartment.set(name);
  }

  /** Normalise a department name/slug for cross-source matching (name ⇄ slug). */
  private normalizeDept(value: string): string {
    return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  protected navigateToDetail(id: string | undefined): void {
    if (!id) return;
    this.router.navigate(['/admin/complaint', id]);
  }

  protected severityBorderColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'var(--color-danger-600)';
      case 'high': return 'var(--color-saffron-500)';
      case 'medium': return 'var(--color-warning-600)';
      default: return 'var(--color-paper-400)';
    }
  }

  protected isCriticalRow(severity: string): boolean {
    return severity === 'critical';
  }

  protected departmentLabel(): string {
    const role = this.currentUser()?.role;
    if (role === 'admin_infrastructure') return 'Infrastructure';
    if (role === 'admin_sanitation') return 'Sanitation';
    return 'Department';
  }

  protected categoryLabel(cat: string): string {
    const labels: Record<string, string> = {
      infrastructure: 'Infrastructure',
      sanitation: 'Sanitation',
      water: 'Water',
      electricity: 'Electricity',
      road: 'Road',
      other: 'Other',
    };
    return labels[cat] ?? cat;
  }
}
