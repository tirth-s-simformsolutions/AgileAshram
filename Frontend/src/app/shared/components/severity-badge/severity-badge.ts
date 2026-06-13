import { Component, computed, input } from '@angular/core';

interface BadgeConfig {
  label: string;
  dotClass: string;
  pillStyle: string;
  pulse: boolean;
}

@Component({
  selector: 'app-severity-badge',
  standalone: true,
  imports: [],
  templateUrl: './severity-badge.html',
})
export class SeverityBadge {
  // Accepts FE union ('low'…) and backend casing ('Low', 'High'…) — normalised below.
  readonly severity = input.required<string>();

  readonly config = computed((): BadgeConfig => {
    switch ((this.severity() ?? '').toLowerCase()) {
      case 'low':
        return {
          label: 'Low',
          dotClass: 'bg-[color:var(--color-ink-400)]',
          pillStyle: 'background:var(--color-paper-200); color:var(--color-ink-500); border:1px solid var(--color-paper-400)',
          pulse: false,
        };
      case 'medium':
        return {
          label: 'Medium',
          dotClass: 'bg-[color:var(--color-warning-600)]',
          pillStyle: 'background:var(--color-warning-50); color:var(--color-warning-600); border:1px solid rgba(220,104,3,0.3)',
          pulse: false,
        };
      case 'high':
        return {
          label: 'High',
          dotClass: 'bg-[color:var(--color-saffron-500)]',
          pillStyle: 'background:var(--color-saffron-50); color:var(--color-saffron-600); border:1px solid rgba(232,131,12,0.35)',
          pulse: false,
        };
      case 'critical':
        return {
          label: 'Critical',
          dotClass: 'bg-[color:var(--color-danger-600)] animate-pulse',
          pillStyle: 'background:var(--color-danger-50); color:var(--color-danger-600); border:1px solid rgba(217,45,32,0.35)',
          pulse: true,
        };
      default:
        return {
          label: this.severity() || 'Unknown',
          dotClass: 'bg-[color:var(--color-ink-400)]',
          pillStyle: 'background:var(--color-paper-200); color:var(--color-ink-500); border:1px solid var(--color-paper-400)',
          pulse: false,
        };
    }
  });
}
