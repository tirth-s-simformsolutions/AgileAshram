import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/auth/login/login').then(m => m.Login) },
  {
    path: 'citizen', canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/citizen/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'complaint', loadComponent: () => import('./pages/citizen/complaint-intake/complaint-intake').then(m => m.ComplaintIntake) },
      { path: 'track', loadComponent: () => import('./pages/citizen/ticket-tracker/ticket-tracker').then(m => m.TicketTracker) },
    ],
  },
  { path: 'admin/login', loadComponent: () => import('./pages/admin/admin-login/admin-login').then(m => m.AdminLogin) },
  {
    path: 'admin', canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'queue', pathMatch: 'full' },
      { path: 'queue', loadComponent: () => import('./pages/admin/complaint-queue/complaint-queue').then(m => m.ComplaintQueue) },
      { path: 'complaint/:id', loadComponent: () => import('./pages/admin/complaint-detail/complaint-detail').then(m => m.ComplaintDetail) },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
