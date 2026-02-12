import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

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

      <div class="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[color:var(--ink-500)]">
        <span>Publie le {{ job.publicationDate | date: 'mediumDate' }}</span>
        <button
          class="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-[color:var(--teal-700)] transition hover:border-[color:var(--teal-600)] disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          [disabled]="!job.landingPageUrl"
          (click)="openOffer()"
        >
          Voir l'offre
        </button>
      </div>
    </article>
  `
})
export class JobCardComponent {
  @Input({ required: true }) job!: Job;

  openOffer(): void {
    if (!this.job.landingPageUrl) {
      return;
    }
    window.open(this.job.landingPageUrl, '_blank', 'noopener');
  }
}
