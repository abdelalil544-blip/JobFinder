import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, finalize, switchMap, take } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { ApplicationsService } from '../../core/services/applications.service';
import { Job } from '../../core/models/job.model';

@Component({
  selector: 'app-job-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="glass-card group flex h-full flex-col overflow-hidden rounded-[2rem] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div class="mb-4 flex items-start justify-between">
        <div class="flex-1">
          <p class="text-xs font-semibold uppercase tracking-wider text-[color:var(--teal-700)]">
            {{ job.company.name }}
          </p>
          <h3 class="mt-1 font-display text-xl leading-tight text-[color:var(--ink-950)] group-hover:text-[color:var(--teal-600)] transition-colors">
            {{ job.title }}
          </h3>
        </div>
      </div>

      <div class="mb-4 flex flex-wrap gap-2 text-[10px]">
        <span class="inline-flex items-center rounded-full bg-[color:var(--mint-100)] px-2.5 py-1 font-medium text-[color:var(--teal-700)]">
          <svg class="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          {{ job.location }}
        </span>
        <span *ngIf="job.type" class="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
          {{ job.type }}
        </span>
      </div>

      <p class="mb-6 line-clamp-3 text-sm leading-relaxed text-[color:var(--ink-700)]">
        {{ job.shortDescription || job.description }}
      </p>

      <div class="mt-auto pt-4 border-t border-black/5">
        <div class="flex items-center justify-between">
          <div class="flex flex-col gap-0.5">
            <span class="text-[10px] font-medium uppercase tracking-wider text-[color:var(--ink-400)]">
              {{ job.publicationDate | date: 'mediumDate' }}
            </span>
            <span *ngIf="job.salary" class="text-xs font-semibold text-[color:var(--teal-600)]">
              {{ job.salary }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button
               *ngIf="isAuthenticated"
               (click)="requestAddFavorite()"
               [disabled]="favoritePending || isFavorite"
               class="rounded-full border border-black/10 p-2 text-[color:var(--ink-700)] transition hover:border-[color:var(--teal-600)] disabled:opacity-50"
               [title]="isFavorite ? 'Déjà en favoris' : 'Ajouter aux favoris'"
            >
               <svg [class.fill-current]="isFavorite" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            </button>
            <button
              *ngIf="isAuthenticated"
              (click)="addToApplications()"
              [disabled]="addingApplication()"
              class="rounded-full bg-[color:var(--ink-950)] px-4 py-2 text-[10px] font-bold text-white transition hover:bg-black disabled:opacity-50"
            >
               {{ addingApplication() ? '...' : 'Postuler' }}
            </button>
            <button
              class="rounded-full border border-black/10 p-2 text-[color:var(--ink-700)] transition hover:bg-black/5"
              (click)="openOffer()"
              title="Voir l'offre originale"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </button>
          </div>
        </div>
      </div>
      
      <div *ngIf="errorMessage() || actionMessage()" class="mt-3">
        <p *ngIf="errorMessage()" class="text-[10px] text-red-600">{{ errorMessage() }}</p>
        <p *ngIf="actionMessage()" class="text-[10px] text-[color:var(--teal-700)] font-medium">{{ actionMessage() }}</p>
      </div>
    </article>
  `
})
export class JobCardComponent {
  @Input({ required: true }) job!: Job;
  @Input() isAuthenticated = false;
  @Input() isFavorite = false;
  @Input() favoritePending = false;
  @Output() favoriteRequested = new EventEmitter<void>();

  actionMessage = signal('');
  errorMessage = signal('');
  addingApplication = signal(false);

  constructor(
    private readonly authService: AuthService,
    private readonly applicationsService: ApplicationsService,
    private readonly router: Router
  ) { }

  openOffer(): void {
    if (!this.job.landingPageUrl) {
      return;
    }
    window.open(this.job.landingPageUrl, '_blank', 'noopener');
  }

  requestAddFavorite(): void {
    if (!this.isAuthenticated || this.isFavorite || this.favoritePending) {
      return;
    }
    this.favoriteRequested.emit();
  }

  addToApplications(): void {
    if (this.addingApplication()) {
      return;
    }

    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const offerId = this.job.id;
    if (!offerId) {
      this.errorMessage.set('Impossible de creer cette candidature.');
      this.actionMessage.set('');
      return;
    }

    this.errorMessage.set('');
    this.actionMessage.set('');
    this.addingApplication.set(true);

    this.applicationsService
      .getByUser(currentUser.id)
      .pipe(
        take(1),
        switchMap((applications) => {
          const alreadyAdded = applications.some(
            (application) => application.offerId === offerId && application.apiSource === 'adzuna'
          );

          if (alreadyAdded) {
            this.actionMessage.set('Cette offre est deja dans vos candidatures.');
            return EMPTY;
          }

          return this.applicationsService.create({
            userId: currentUser.id,
            offerId,
            apiSource: 'adzuna',
            title: this.job.title,
            company: this.job.company.name,
            location: this.job.location,
            url: this.job.landingPageUrl,
            status: 'en_attente',
            dateAdded: new Date().toISOString()
          });
        }),
        finalize(() => {
          this.addingApplication.set(false);
        })
      )
      .subscribe({
        next: () => {
          this.actionMessage.set('Candidature ajoutee.');
          this.errorMessage.set('');
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message || 'Impossible de creer cette candidature.');
          this.actionMessage.set('');
        }
      });
  }

}
