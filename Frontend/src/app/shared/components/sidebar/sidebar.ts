import { Component, signal, inject, computed, HostListener, DestroyRef } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  isMobileOpen = signal(false);

  protected readonly departmentLabel = computed(() => {
    const role = this.currentUser()?.role;
    if (role === 'admin_infrastructure') return 'Infrastructure';
    if (role === 'admin_sanitation') return 'Sanitation';
    return 'Department';
  });

  constructor() {
    const router = inject(Router);
    const destroyRef = inject(DestroyRef);

    router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(destroyRef)
    ).subscribe(() => this.isMobileOpen.set(false));
  }

  protected toggleCollapse(): void {
    this.isCollapsed.update(v => !v);
  }

  openMobileSidebar(): void { this.isMobileOpen.set(true); }
  closeMobileSidebar(): void { this.isMobileOpen.set(false); }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isMobileOpen()) this.closeMobileSidebar();
  }
}
