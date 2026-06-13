import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-login.html',
})
export class AdminLogin {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);
  protected readonly shakeCard = signal(false);

  protected readonly form = this.fb.group({
    role:     ['department' as 'department' | 'admin', [Validators.required]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected selectRole(role: 'department' | 'admin'): void {
    this.form.get('role')?.setValue(role);
  }

  protected togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.isLoading()) return;
    this.error.set(null);
    this.isLoading.set(true);
    const { email, password, role } = this.form.getRawValue();
    this.auth.adminLogin(email!, password!, role!).subscribe({
      next: () => this.router.navigate(['/admin/queue']),
      error: () => {
        this.isLoading.set(false);
        this.error.set('Invalid email or password. Please try again.');
        this.triggerShake();
      },
    });
  }

  private triggerShake(): void {
    this.shakeCard.set(true);
    setTimeout(() => this.shakeCard.set(false), 600);
  }
}
