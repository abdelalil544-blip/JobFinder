import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, finalize, switchMap, take } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { ApplicationsService } from '../../core/services/applications.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { Job } from '../../core/models/job.model';

@Component({
  selector: 'app-job-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="rounded-3xl border border-black/5 bg-white/80 p-5 shadow-sm">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--teal-700)]">
            {{ job.company.name }}
          </p>
          <h3 class="mt-2 font-display text-xl text-[color:var(--ink-950)]">
            {{ job.title }}
          </h3>
        </div>
        <span class="rounded-full bg-[color:var(--mint-100)] px-3 py-1 text-xs font-semibold text-[color:var(--teal-700)]">
          {{ job.location }}
        </span>
      </div>

      <p class="mt-3 text-sm text-[color:var(--ink-700)]">
        {{ job.shortDescription || job.description }}
      </p>

      <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-[color:var(--ink-500)]">
        <span *ngIf="job.salary">Salaire: {{ job.salary }}</span>
        <span *ngIf="job.type">Type: {{ job.type }}</span>
        <span *ngIf="job.contractTime">Temps: {{ job.contractTime }}</span>
        <span *ngIf="job.level">Niveau: {{ job.level }}</span>
      </div>

      <p class="mt-4 text-xs text-[color:#b42318]" *ngIf="errorMessage">{{ errorMessage }}</p>
      <p class="mt-4 text-xs text-[color:var(--teal-700)]" *ngIf="actionMessage">{{ actionMessage }}</p>

      <div class="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[color:var(--ink-500)]">
        <span>Publie le {{ job.publicationDate | date: 'mediumDate' }}</span>
        <div class="flex flex-wrap items-center gap-2">
          <button
            class="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-[color:var(--ink-700)] transition hover:border-[color:var(--teal-600)] disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            [disabled]="addingFavorite"
            (click)="addToFavorites()"
          >
            {{ addingFavorite ? 'Ajout...' : 'Favoris' }}
          </button>
          <button
            class="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-[color:var(--ink-700)] transition hover:border-[color:var(--teal-600)] disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            [disabled]="addingApplication"
            (click)="addToApplications()"
          >
            {{ addingApplication ? 'Ajout...' : 'Candidature' }}
          </button>
          <button
            class="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-[color:var(--teal-700)] transition hover:border-[color:var(--teal-600)] disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            [disabled]="!job.landingPageUrl"
            (click)="openOffer()"
          >
            Voir l'offre
          </button>
        </div>
      </div>
    </article>
  `
})
export class JobCardComponent {
  @Input({ required: true }) job!: Job;
  actionMessage = '';
  errorMessage = '';
  addingFavorite = false;
  addingApplication = false;

  constructor(
    private readonly authService: AuthService,
    private readonly favoritesService: FavoritesService,
    private readonly applicationsService: ApplicationsService,
    private readonly router: Router
  ) {}

  openOffer(): void {
    if (!this.job.landingPageUrl) {
      return;
    }
    window.open(this.job.landingPageUrl, '_blank', 'noopener');
  }

  addToFavorites(): void {
    if (this.addingFavorite) {
      return;
    }

    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const offerId = this.toOfferId();
    if (offerId === null) {
      this.errorMessage = "Impossible d'ajouter cette offre aux favoris.";
      this.actionMessage = '';
      return;
    }

    this.errorMessage = '';
    this.actionMessage = '';
    this.addingFavorite = true;

    this.favoritesService
      .getByUser(currentUser.id)
      .pipe(
        take(1),
        switchMap((favorites) => {
          const alreadyAdded = favorites.some(
            (favorite) => favorite.offerId === offerId && favorite.apiSource === 'themuse'
          );

          if (alreadyAdded) {
            this.actionMessage = 'Cette offre est deja dans vos favoris.';
            return EMPTY;
          }

          return this.favoritesService.create({
            userId: currentUser.id,
            offerId,
            apiSource: 'themuse',
            title: this.job.title,
            company: this.job.company.name,
            location: this.job.location,
            url: this.job.landingPageUrl,
            datePublished: this.job.publicationDate
          });
        }),
        finalize(() => {
          this.addingFavorite = false;
        })
      )
      .subscribe({
        next: () => {
          this.actionMessage = 'Offre ajoutee aux favoris.';
          this.errorMessage = '';
        },
        error: (error: Error) => {
          this.errorMessage = error.message || "Impossible d'ajouter cette offre aux favoris.";
          this.actionMessage = '';
        }
      });
  }

  addToApplications(): void {
    if (this.addingApplication) {
      return;
    }

    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const offerId = this.toOfferId();
    if (offerId === null) {
      this.errorMessage = 'Impossible de creer cette candidature.';
      this.actionMessage = '';
      return;
    }

    this.errorMessage = '';
    this.actionMessage = '';
    this.addingApplication = true;

    this.applicationsService
      .getByUser(currentUser.id)
      .pipe(
        take(1),
        switchMap((applications) => {
          const alreadyAdded = applications.some(
            (application) => application.offerId === offerId && application.apiSource === 'themuse'
          );

          if (alreadyAdded) {
            this.actionMessage = 'Cette offre est deja dans vos candidatures.';
            return EMPTY;
          }

          return this.applicationsService.create({
            userId: currentUser.id,
            offerId,
            apiSource: 'themuse',
            title: this.job.title,
            company: this.job.company.name,
            location: this.job.location,
            url: this.job.landingPageUrl,
            status: 'en_attente',
            dateAdded: new Date().toISOString()
          });
        }),
        finalize(() => {
          this.addingApplication = false;
        })
      )
      .subscribe({
        next: () => {
          this.actionMessage = 'Candidature ajoutee.';
          this.errorMessage = '';
        },
        error: (error: Error) => {
          this.errorMessage = error.message || 'Impossible de creer cette candidature.';
          this.actionMessage = '';
        }
      });
  }

  private toOfferId(): number | null {
    const parsedId = Number(this.job.id);
    return Number.isFinite(parsedId) ? parsedId : null;
  }
}
