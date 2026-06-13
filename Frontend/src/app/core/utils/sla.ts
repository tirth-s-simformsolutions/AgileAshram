// Human-friendly duration + SLA presentation helpers for complaint time tracking.

const MS_PER_MIN = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MIN;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/** "3 days 4 hrs", "5 hrs", "20 min", "less than a minute" — coarse, never negative. */
export function formatDuration(ms: number): string {
  const abs = Math.max(0, Math.abs(ms));
  const days = Math.floor(abs / MS_PER_DAY);
  const hours = Math.floor((abs % MS_PER_DAY) / MS_PER_HOUR);
  const mins = Math.floor((abs % MS_PER_HOUR) / MS_PER_MIN);

  if (days > 0) return hours > 0 ? `${days} day${days > 1 ? 's' : ''} ${hours} hr${hours > 1 ? 's' : ''}` : `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return mins > 0 ? `${hours} hr${hours > 1 ? 's' : ''} ${mins} min` : `${hours} hr${hours > 1 ? 's' : ''}`;
  if (mins > 0) return `${mins} min`;
  return 'less than a minute';
}

export interface SlaView {
  overdue: boolean;
  label: string; // "3 days 4 hrs left" | "Overdue by 2 days"
  tone: 'ok' | 'warn' | 'danger';
}

/** Time-left view for an open complaint, relative to its dueDate. */
export function slaView(dueDate: Date, now: number = Date.now()): SlaView {
  const remaining = dueDate.getTime() - now;
  const overdue = remaining < 0;
  return {
    overdue,
    label: overdue ? `Overdue by ${formatDuration(remaining)}` : `${formatDuration(remaining)} left`,
    tone: overdue ? 'danger' : remaining <= 2 * MS_PER_DAY ? 'warn' : 'ok',
  };
}
