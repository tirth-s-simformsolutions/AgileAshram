import { Component, computed, input } from '@angular/core';
import { ComplaintStatus } from '../../../core/models/complaint.model';

interface ChipConfig {
  label: string;
  dotClass: string;
  pillStyle: string;
}

@Component({
  selector: 'app-status-chip',
  standalone: true,
  imports: [],
  templateUrl: './status-chip.html',
})
export class StatusChip {
  readonly status = input.required<ComplaintStatus>();

  readonly config = computed((): ChipConfig => {
    switch (this.status()) {
      case 'submitted':
        return {
          label: 'Submitted',
          dotClass: 'bg-[color:var(--color-primary-700)]',
          pillStyle: 'background:var(--color-primary-100); color:var(--color-primary-700); border:1px solid rgba(31,59,133,0.25)',
        };
      case 'under_review':
        return {
          label: 'Under Review',
          dotClass: 'bg-[color:var(--color-warning-600)]',
          pillStyle: 'background:var(--color-warning-50); color:var(--color-warning-600); border:1px solid rgba(220,104,3,0.3)',
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          dotClass: 'bg-[color:var(--color-saffron-500)] animate-pulse',
          pillStyle: 'background:var(--color-saffron-50); color:var(--color-saffron-600); border:1px solid rgba(232,131,12,0.35)',
        };
      case 'resolved':
        return {
          label: 'Resolved',
          dotClass: 'bg-[color:var(--color-green-600)]',
          pillStyle: 'background:rgba(26,127,75,0.08); color:var(--color-green-600); border:1px solid rgba(26,127,75,0.3)',
        };
      case 'rejected':
        return {
          label: 'Rejected',
          dotClass: 'bg-[color:var(--color-danger-600)]',
          pillStyle: 'background:var(--color-danger-50); color:var(--color-danger-600); border:1px solid rgba(217,45,32,0.35)',
        };
    }
  });
}
