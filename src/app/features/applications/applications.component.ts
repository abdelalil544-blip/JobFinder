import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { take } from 'rxjs';

import { Application } from '../../core/models/application.model';
import { AuthService } from '../../core/services/auth.service';
import { ApplicationsService } from '../../core/services/applications.service';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="space-y-6">
      <header class="space-y-2">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--coral-500)]">
          Candidatures
        </p>
        <h1 class="font-display text-3xl text-[color:var(--ink-950)]">Suivi de vos demarches</h1>
        <p class="text-sm text-[color:var(--ink-700)]">
          Visualisez l'etat de chaque candidature et ajoutez vos notes.
        </p>
        <div class="mt-4 flex flex-wrap gap-3">
          <a
            class="rounded-2xl border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-[color:var(--ink-700)] shadow-sm transition hover:border-[color:var(--teal-600)]"
            routerLink="/jobs"
          >
            Voir les offres
          </a>
          <a
            class="rounded-2xl bg-[color:var(--teal-600)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[color:var(--teal-700)]"
            routerLink="/favorites"
          >
            Mes favoris
          </a>
          <a
            class="rounded-2xl border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-[color:var(--ink-700)] shadow-sm transition hover:border-[color:var(--teal-600)]"
            routerLink="/profile"
          >
            Mon profil
          </a>
        </div>
      </header>

      <p class="text-sm text-[color:#b42318]" *ngIf="errorMessage">{{ errorMessage }}</p>

      <div class="grid gap-5">
        <div class="glass-card rounded-3xl p-6" *ngFor="let application of applications; trackBy: trackById">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 class="font-display text-lg text-[color:var(--ink-950)]">{{ application.title }}</h2>
              <p class="text-sm text-[color:var(--ink-700)]">
                {{ application.company }} · {{ application.location }}
              </p>
            </div>
            <span class="rounded-full bg-[rgba(241,178,74,0.2)] px-3 py-1 text-xs font-semibold text-[color:var(--ink-950)]">
              {{ labelForStatus(application.status) }}
            </span>
          </div>
          <p class="mt-4 text-sm text-[color:var(--ink-700)]" *ngIf="application.notes">
            Note: {{ application.notes }}
          </p>
          <div class="mt-5 flex flex-wrap gap-3">
            <button
              class="rounded-2xl bg-[color:var(--teal-600)] px-4 py-2 text-xs font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              [disabled]="!application.url"
              (click)="openOffer(application.url)"
            >
              Voir l'offre
            </button>
            <button
              class="rounded-2xl border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--ink-700)]"
              type="button"
              (click)="remove(application)"
            >
              Supprimer
            </button>
          </div>
        </div>

        <div
          class="rounded-3xl border border-dashed border-black/20 bg-white/60 p-6 text-center text-sm text-[color:var(--ink-700)]"
          *ngIf="applications.length === 0 && !errorMessage"
        >
          Vos prochaines candidatures suivies seront listees ici.
        </div>
      </div>
    </section>
  `
})
export class ApplicationsComponent {
  applications: Application[] = [];
  errorMessage = '';

  private readonly userId: number;

  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      this.userId = 0;
      this.router.navigate(['/auth/login']);
      return;
    }

    this.userId = currentUser.id;
    this.loadApplications();
  }

  trackById(_: number, application: Application): number {
    return application.id;
  }

  openOffer(url: string): void {
    if (!url) {
      return;
    }
    window.open(url, '_blank', 'noopener');
  }

  remove(application: Application): void {
    this.errorMessage = '';
    this.applicationsService
      .delete(application.id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.applications = this.applications.filter((item) => item.id !== application.id);
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
        }
      });
  }

  labelForStatus(status: Application['status']): string {
    switch (status) {
      case 'accepte':
        return 'Accepte';
      case 'refuse':
        return 'Refuse';
      default:
        return 'En attente';
    }
  }

  private loadApplications(): void {
    this.errorMessage = '';
    this.applicationsService
      .getByUser(this.userId)
      .pipe(take(1))
      .subscribe({
        next: (applications) => {
          this.applications = applications;
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
        }
      });
  }
}
