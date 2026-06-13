import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

interface SpokePoint { cos: number; sin: number; }

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.html',
})
export class Navbar {
  protected readonly auth = inject(AuthService);
  protected readonly router = inject(Router);
  protected readonly currentUser = this.auth.currentUser;

  // 24 spokes for the Ashoka-style chakra
  protected readonly spokes: SpokePoint[] = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * Math.PI * 2) / 24;
    return { cos: Math.cos(angle), sin: Math.sin(angle) };
  });

  protected readonly userInitials = computed(() => {
    const user = this.currentUser();
    if (!user?.name) return '?';
    return user.name
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  protected logout(): void {
    this.auth.logout();
  }
}
