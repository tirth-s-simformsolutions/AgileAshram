import { Component, signal, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  protected readonly auth = inject(AuthService);
  protected readonly currentUser = this.auth.currentUser;

  protected readonly isCollapsed = signal(false);

  protected readonly departmentLabel = computed(() => {
    const role = this.currentUser()?.role;
    if (role === 'admin_infrastructure') return 'Infrastructure';
    if (role === 'admin_sanitation') return 'Sanitation';
    return 'Department';
  });

  protected toggleCollapse(): void {
    this.isCollapsed.update(v => !v);
  }
}
