import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user.model';

// Only user object is persisted — tokens live in HttpOnly cookies (never readable by JS)
const USER_KEY          = 'nv_user';
const SETU_REQUEST_KEY  = 'nv_setu_req_id';

interface InitiateResponse {
  setuRequestId: string;
  loginUrl: string;
}

interface CompleteResponse {
  userInfo: User;
}

interface AdminLoginResponse {
  userInfo: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http       = inject(HttpClient);
  private readonly router     = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly currentUser = signal<User | null>(this.loadUser());

  // ---------------------------------------------------------------------------
  // Session helpers (token is HttpOnly cookie — never touch it in JS)
  // ---------------------------------------------------------------------------

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private loadUser(): User | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as User; } catch { return null; }
  }

  saveUser(user: User): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  isAdmin(): boolean {
    const role = this.currentUser()?.role;
    return role === 'department' || role === 'admin' || role === 'admin_infrastructure' || role === 'admin_sanitation';
  }

  logout(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(SETU_REQUEST_KEY);
    }
    this.currentUser.set(null);
    // Ask backend to clear HttpOnly cookies
    this.http.post('/api/v1/auth/logout', {}).subscribe({ error: () => {} });
    this.router.navigate(['/login']);
  }

  // ---------------------------------------------------------------------------
  // DigiLocker — two-step: initiate → redirect → complete
  // ---------------------------------------------------------------------------

  loginWithDigiLocker(): void {
    this.http
      .post<{ data: InitiateResponse }>('/api/v1/auth/digilocker/initiate', {})
      .subscribe({
        next: res => {
          if (!this.isBrowser()) return;
          const { setuRequestId, loginUrl } = res.data;
          sessionStorage.setItem(SETU_REQUEST_KEY, setuRequestId);

          // Mock mode: backend returns a non-navigable placeholder URL.
          // Skip the redirect and complete auth in-place.
          if (loginUrl.startsWith('http://mock')) {
            this.completeDigiLockerAuth().subscribe({
              next: () => this.router.navigate(['/citizen/dashboard']),
            });
            return;
          }

          window.location.href = loginUrl;
        },
      });
  }

  /** Called when the user lands back on /login after DigiLocker auth. */
  completeDigiLockerAuth(): Observable<{ data: CompleteResponse }> {
    const requestId = this.isBrowser()
      ? (sessionStorage.getItem(SETU_REQUEST_KEY) ?? '')
      : '';
    return this.http
      .post<{ data: CompleteResponse }>('/api/v1/auth/digilocker/complete', { id: requestId })
      .pipe(
        tap(res => {
          if (this.isBrowser()) sessionStorage.removeItem(SETU_REQUEST_KEY);
          this.saveUser(res.data.userInfo);
        })
      );
  }

  hasPendingDigiLockerCallback(): boolean {
    if (!this.isBrowser()) return false;
    return sessionStorage.getItem(SETU_REQUEST_KEY) !== null;
  }

  // ---------------------------------------------------------------------------
  // Admin login
  // ---------------------------------------------------------------------------

  adminLogin(email: string, password: string, role = 'department'): Observable<{ data: AdminLoginResponse }> {
    return this.http
      .post<{ data: AdminLoginResponse }>('/api/v1/auth/admin/login', { email, password, role })
      .pipe(tap(res => this.saveUser(res.data.userInfo)));
  }

  // ---------------------------------------------------------------------------
  // Profile refresh (call after app init to hydrate currentUser from cookie)
  // ---------------------------------------------------------------------------

  fetchProfile(): Observable<{ data: User }> {
    return this.http
      .get<{ data: User }>('/api/v1/user/profile')
      .pipe(tap(res => this.saveUser(res.data)));
  }
}
