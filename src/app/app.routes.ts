import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'jobs',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: 'jobs',
    loadComponent: () =>
      import('./features/jobs/jobs.component').then((m) => m.JobsComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile.component').then((m) => m.ProfileComponent)
  },
  {
    path: 'favorites',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/favorites/favorites.component').then((m) => m.FavoritesComponent)
  },
  {
    path: 'applications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/applications/applications.component').then(
        (m) => m.ApplicationsComponent
      )
  },
  {
    path: '**',
    redirectTo: 'jobs'
  }
];
