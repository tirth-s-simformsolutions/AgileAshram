import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user.model';

const TOKEN_KEY = 'nv_token';
const USER_KEY  = 'nv_user';

interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http       = inject(HttpClient);
  private readonly router     = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly currentUser = signal<User | null>(this.loadUser());

  // ---------------------------------------------------------------------------
  // Session helpers
  // ---------------------------------------------------------------------------

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private loadUser(): User | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  saveSession(token: string, user: User): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  getToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null && this.currentUser() !== null;
  }

  isAdmin(): boolean {
    const role = this.currentUser()?.role;
    return role === 'admin_infrastructure' || role === 'admin_sanitation';
  }

  logout(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  // ---------------------------------------------------------------------------
  // DigiLocker OAuth
  // ---------------------------------------------------------------------------

  loginWithDigiLocker(): void {
    const authorizeUrl = 'https://sandbox.api-setu.in/digilocker/oauth/authorize';
    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     'nagarvaani',
      redirect_uri:  `${window.location.origin}/login`,
      scope:         'openid profile',
      state:         crypto.randomUUID(),
    });
    window.location.href = `${authorizeUrl}?${params.toString()}`;
  }

  handleOAuthCallback(code: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/auth/digilocker/callback', { code })
      .pipe(tap(res => this.saveSession(res.token, res.user)));
  }

  // ---------------------------------------------------------------------------
  // Admin login
  // ---------------------------------------------------------------------------

  adminLogin(username: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/auth/admin/login', { username, password })
      .pipe(tap(res => this.saveSession(res.token, res.user)));
  }
}
