import { Component, inject, signal, PLATFORM_ID, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private readonly auth       = inject(AuthService);
  private readonly router     = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly isRedirecting      = signal(false);
  protected readonly isHandlingCallback = signal(false);
  protected readonly callbackError      = signal<string | null>(null);
  protected readonly currentYear        = new Date().getFullYear();

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/citizen/dashboard']);
      return;
    }

    // User returned from DigiLocker — sessionStorage has the pending request ID
    if (isPlatformBrowser(this.platformId) && this.auth.hasPendingDigiLockerCallback()) {
      this.isHandlingCallback.set(true);
      this.auth.completeDigiLockerAuth().subscribe({
        next: () => this.router.navigate(['/citizen/dashboard']),
        error: () => {
          this.isHandlingCallback.set(false);
          this.callbackError.set('Authentication failed. Please try again.');
        },
      });
    }
  }

  protected initiateDigiLockerLogin(): void {
    this.isRedirecting.set(true);
    if (isPlatformBrowser(this.platformId)) {
      this.auth.loginWithDigiLocker();
    }
  }
}
