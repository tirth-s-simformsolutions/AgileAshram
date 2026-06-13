import { Component, inject, signal, PLATFORM_ID, OnInit } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly isRedirecting = signal(false);
  protected readonly isHandlingCallback = signal(false);
  protected readonly callbackError = signal<string | null>(null);

  ngOnInit(): void {
    // If already authenticated, redirect
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/citizen/dashboard']);
      return;
    }
    // Handle DigiLocker OAuth callback
    this.route.queryParams.subscribe(params => {
      const code = params['code'] as string | undefined;
      if (code) {
        this.isHandlingCallback.set(true);
        this.auth.handleOAuthCallback(code).subscribe({
          next: () => this.router.navigate(['/citizen/dashboard']),
          error: () => {
            this.isHandlingCallback.set(false);
            this.callbackError.set('Authentication failed. Please try again.');
          },
        });
      }
    });
  }

  protected initiateDigiLockerLogin(): void {
    this.isRedirecting.set(true);
    if (isPlatformBrowser(this.platformId)) {
      this.auth.loginWithDigiLocker();
    }
  }
}
