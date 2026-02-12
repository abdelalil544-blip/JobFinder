import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, take } from 'rxjs';

import { Job, JobSearchParams } from '../../core/models/job.model';
import { JobsService } from '../../core/services/jobs.service';
import { JobCardComponent } from './job-card.component';

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, JobCardComponent],
  templateUrl: './jobs.component.html'
})
export class JobsComponent {
  readonly form;

  jobs: Job[] = [];
  errorMessage = '';
  loading = false;

  currentPage = 1;
  totalPages = 1;
  pageSize = 20;

  private lastCriteria: JobSearchParams | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly jobsService: JobsService
  ) {
    this.form = this.formBuilder.group({
      keywords: ['', [Validators.required]],
      location: [''],
      country: ['fr', [Validators.required]]
    });
  }

  onSearch(): void {
    if (this.form.invalid || !this.hasValidKeywords()) {
      this.form.markAllAsTouched();
      return;
    }

    this.fetchJobs(1);
  }

  goToPage(page: number): void {
    if (!this.lastCriteria) {
      return;
    }

    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.fetchJobs(page);
  }

  get pages(): number[] {
    const maxPages = 5;
    const start = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    const end = Math.min(this.totalPages, start + maxPages - 1);
    const adjustedStart = Math.max(1, end - maxPages + 1);

    const pages: number[] = [];
    for (let page = adjustedStart; page <= end; page += 1) {
      pages.push(page);
    }
    return pages;
  }

  trackById(_: number, job: Job): string {
    return job.id;
  }

  private fetchJobs(page: number): void {
    this.errorMessage = '';
    this.loading = true;

    const { keywords, location, country } = this.form.getRawValue();
    const criteria: JobSearchParams = {
      keywords: (keywords ?? '').trim(),
      location: (location ?? '').trim(),
      country: country ?? 'fr',
      page,
      resultsPerPage: this.pageSize
    };

    this.lastCriteria = criteria;

    this.jobsService
      .searchJobs(criteria)
      .pipe(
        take(1),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response) => {
          const sorted = [...response.jobs].sort((a, b) => {
            const dateA = a.publicationDate ? new Date(a.publicationDate).getTime() : 0;
            const dateB = b.publicationDate ? new Date(b.publicationDate).getTime() : 0;
            return dateB - dateA;
          });

          this.jobs = sorted;
          this.totalPages = response.totalPages || 1;
          this.currentPage = response.currentPage || page;
        },
        error: (error: { message?: string }) => {
          this.errorMessage = error?.message || 'Impossible de charger les offres.';
          this.jobs = [];
          this.totalPages = 1;
          this.currentPage = 1;
        }
      });
  }

  private hasValidKeywords(): boolean {
    const { keywords } = this.form.getRawValue();
    return !!(keywords ?? '').trim();
  }
}
