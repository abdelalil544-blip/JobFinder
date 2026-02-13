import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, finalize, map, take } from 'rxjs';
import { Subscription } from 'rxjs';

import { Job, JobSearchParams } from '../../core/models/job.model';
import { JobsService } from '../../core/services/jobs.service';
import { JobCardComponent } from './job-card.component';

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, JobCardComponent],
  templateUrl: './jobs.component.html'
})
export class JobsComponent implements OnInit, OnDestroy {
  readonly form;

  jobs: Job[] = [];
  errorMessage = '';
  loading = false;

  currentPage = 1;
  totalPages = 1;
  pageSize = 5;

  private readonly AUTO_SEARCH_DELAY = 400;
  private lastCriteria: JobSearchParams | null = null;
  private lastRequestKey = '';
  private activeRequest: Subscription | null = null;
  private requestId = 0;
  private autoSearchSub: Subscription | null = null;
  private destroyed = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly jobsService: JobsService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.form = this.formBuilder.group({
      keywords: [''],
      location: [''],
      country: ['fr', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.fetchJobs(1, this.buildInitialCriteria(), true);

    this.autoSearchSub = this.form.valueChanges
      .pipe(
        debounceTime(this.AUTO_SEARCH_DELAY),
        map(() => this.buildCriteriaFromForm(1)),
        filter((criteria) => this.isCriteriaValid(criteria)),
        map((criteria) => ({ criteria, key: this.requestKey(criteria) })),
        distinctUntilChanged((a, b) => a.key === b.key)
      )
      .subscribe(({ criteria }) => {
        this.fetchJobs(1, criteria);
      });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.autoSearchSub) {
      this.autoSearchSub.unsubscribe();
      this.autoSearchSub = null;
    }
    if (this.activeRequest) {
      this.activeRequest.unsubscribe();
      this.activeRequest = null;
    }
  }

  onSearch(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.loading) {
      return;
    }

    this.fetchJobs(1, this.buildCriteriaFromForm(1));
  }

  goToPage(page: number): void {
    if (!this.lastCriteria) {
      return;
    }

    if (page < 1 || page > this.totalPages) {
      return;
    }

    const criteria = this.buildCriteriaFromLast(page);
    if (!criteria) {
      return;
    }
    this.fetchJobs(page, criteria);
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

  private fetchJobs(
    page: number,
    criteria?: JobSearchParams,
    force = false
  ): void {
    const resolvedCriteria = criteria ?? this.buildCriteriaFromForm(page);
    if (!this.isCriteriaValid(resolvedCriteria)) {
      return;
    }
    const requestKey = this.requestKey(resolvedCriteria);
    if (!force && requestKey === this.lastRequestKey) {
      return;
    }
    this.lastRequestKey = requestKey;
    this.errorMessage = '';
    this.loading = true;
    this.requestId += 1;
    const currentRequestId = this.requestId;

    if (this.activeRequest) {
      this.activeRequest.unsubscribe();
      this.activeRequest = null;
    }

    const requestCriteria = { ...resolvedCriteria, page };
    this.lastCriteria = requestCriteria;

    this.activeRequest = this.jobsService
      .searchJobs(requestCriteria)
      .pipe(
        take(1),
        finalize(() => {
          if (this.requestId === currentRequestId) {
            this.loading = false;
            this.scheduleViewUpdate();
          }
        })
      )
      .subscribe({
        next: (response) => {
          if (this.requestId !== currentRequestId) {
            return;
          }
          const sorted = [...response.jobs].sort((a, b) => {
            const dateA = a.publicationDate ? new Date(a.publicationDate).getTime() : 0;
            const dateB = b.publicationDate ? new Date(b.publicationDate).getTime() : 0;
            return dateB - dateA;
          });

          this.jobs = sorted;
          this.totalPages = response.totalPages || 1;
          this.currentPage = response.currentPage || page;
          this.scheduleViewUpdate();
        },
        error: (error: { message?: string }) => {
          if (this.requestId !== currentRequestId) {
            return;
          }
          this.errorMessage = error?.message || 'Impossible de charger les offres.';
          this.jobs = [];
          this.totalPages = 1;
          this.currentPage = 1;
          this.scheduleViewUpdate();
        }
      });
  }

  private isCriteriaValid(criteria: JobSearchParams): boolean {
    const hasCountry = !!(criteria.country ?? '').trim();
    return hasCountry;
  }

  private buildCriteriaFromForm(page: number): JobSearchParams {
    const { keywords, location, country } = this.form.getRawValue();
    return {
      keywords: (keywords ?? '').trim(),
      location: (location ?? '').trim(),
      country: country ?? 'fr',
      page,
      resultsPerPage: this.pageSize,
      sortBy: 'date'
    };
  }

  private buildInitialCriteria(): JobSearchParams {
    const { location, country } = this.form.getRawValue();
    return {
      location: (location ?? '').trim(),
      country: country ?? 'fr',
      page: 1,
      resultsPerPage: this.pageSize,
      sortBy: 'date'
    };
  }

  private buildCriteriaFromLast(page: number): JobSearchParams | null {
    if (!this.lastCriteria) {
      return null;
    }
    return {
      ...this.lastCriteria,
      page
    };
  }

  private requestKey(criteria: JobSearchParams): string {
    return JSON.stringify({
      keywords: criteria.keywords ?? '',
      location: criteria.location ?? '',
      country: criteria.country ?? '',
      page: criteria.page ?? 1,
      resultsPerPage: criteria.resultsPerPage ?? this.pageSize,
      category: criteria.category ?? '',
      sortBy: criteria.sortBy ?? '',
      contractType: criteria.contractType ?? '',
      contractTime: criteria.contractTime ?? '',
      salaryMin: criteria.salaryMin ?? ''
    });
  }

  private scheduleViewUpdate(): void {
    if (this.destroyed) {
      return;
    }
    Promise.resolve().then(() => {
      if (this.destroyed) {
        return;
      }
      this.cdr.detectChanges();
    });
  }
}
