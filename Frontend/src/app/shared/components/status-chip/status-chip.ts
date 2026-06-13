import { Component, computed, input } from '@angular/core';

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
  // Accepts the backend enum ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED') — normalised below.
  readonly status = input.required<string>();

  readonly config = computed((): ChipConfig => {
    switch ((this.status() ?? '').toUpperCase()) {
      case 'OPEN':
        return {
          label: 'Open',
          dotClass: 'bg-[color:var(--color-primary-700)]',
          pillStyle: 'background:var(--color-primary-100); color:var(--color-primary-700); border:1px solid rgba(31,59,133,0.25)',
        };
      case 'IN_PROGRESS':
        return {
          label: 'In Progress',
          dotClass: 'bg-[color:var(--color-saffron-500)] animate-pulse',
          pillStyle: 'background:var(--color-saffron-50); color:var(--color-saffron-600); border:1px solid rgba(232,131,12,0.35)',
        };
      case 'RESOLVED':
        return {
          label: 'Resolved',
          dotClass: 'bg-[color:var(--color-green-600)]',
          pillStyle: 'background:rgba(26,127,75,0.08); color:var(--color-green-600); border:1px solid rgba(26,127,75,0.3)',
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          dotClass: 'bg-[color:var(--color-danger-600)]',
          pillStyle: 'background:var(--color-danger-50); color:var(--color-danger-600); border:1px solid rgba(217,45,32,0.35)',
        };
      default:
        return {
          label: this.status() || 'Unknown',
          dotClass: 'bg-[color:var(--color-ink-400)]',
          pillStyle: 'background:var(--color-paper-200); color:var(--color-ink-500); border:1px solid var(--color-paper-400)',
        };
    }
  });
}
