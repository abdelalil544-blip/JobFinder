import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { debounceTime, distinctUntilChanged, filter, finalize, map, take } from 'rxjs';
import { Subscription } from 'rxjs';

import { Job, JobSearchParams } from '../../core/models/job.model';
import { PublicUser } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { JobsService } from '../../core/services/jobs.service';
import * as FavoritesActions from '../../store/favorites/favorites.actions';
import {
  selectAddingOfferIds,
  selectFavoriteOfferIds
} from '../../store/favorites/favorites.selectors';
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
  pageSize = 10;
  currentUser = signal<PublicUser | null>(null);
  favoriteOfferIdsSet = signal(new Set<number>());
  addingOfferIdsSet = signal(new Set<number>());

  private readonly AUTO_SEARCH_DELAY = 400;
  private lastCriteria: JobSearchParams | null = null;
  private lastRequestKey = '';
  private activeRequest: Subscription | null = null;
  private requestId = 0;
  private autoSearchSub: Subscription | null = null;
  private authSub: Subscription | null = null;
  private favoriteIdsSub: Subscription | null = null;
  private addingOfferIdsSub: Subscription | null = null;
  private destroyed = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly jobsService: JobsService,
    private readonly cdr: ChangeDetectorRef,
    private readonly authService: AuthService,
    private readonly store: Store
  ) {
    this.form = this.formBuilder.group({
      keywords: [''],
      location: [''],
      country: ['fr', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.authSub = this.authService.currentUser$
      .pipe(distinctUntilChanged((a, b) => a?.id === b?.id))
      .subscribe((user) => {
        this.currentUser.set(user);

        if (user) {
          this.store.dispatch(FavoritesActions.loadFavorites({ userId: user.id }));
        } else {
          this.store.dispatch(FavoritesActions.clearFavorites());
        }
        this.cdr.detectChanges();
      });

    this.favoriteIdsSub = this.store.select(selectFavoriteOfferIds).subscribe((offerIds) => {
      this.favoriteOfferIdsSet.set(new Set(offerIds));
      this.cdr.detectChanges();
    });

    this.addingOfferIdsSub = this.store.select(selectAddingOfferIds).subscribe((offerIds) => {
      this.addingOfferIdsSet.set(new Set(offerIds));
      this.cdr.detectChanges();
    });

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
    if (this.authSub) {
      this.authSub.unsubscribe();
      this.authSub = null;
    }
    if (this.favoriteIdsSub) {
      this.favoriteIdsSub.unsubscribe();
      this.favoriteIdsSub = null;
    }
    if (this.addingOfferIdsSub) {
      this.addingOfferIdsSub.unsubscribe();
      this.addingOfferIdsSub = null;
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

  onAddFavorite(job: Job): void {
    if (!this.currentUser()) {
      return;
    }

    const offerId = this.toOfferId(job);
    if (offerId === null || this.favoriteOfferIdsSet().has(offerId)) {
      return;
    }

    this.store.dispatch(
      FavoritesActions.addFavorite({
        userId: this.currentUser()!.id,
        favorite: {
          userId: this.currentUser()!.id,
          offerId,
          apiSource: 'themuse',
          title: job.title,
          company: job.company.name,
          location: job.location,
          url: job.landingPageUrl,
          datePublished: job.publicationDate
        }
      })
    );
  }

  isFavorite(job: Job): boolean {
    const offerId = this.toOfferId(job);
    return offerId !== null && this.favoriteOfferIdsSet().has(offerId);
  }

  isAddingFavorite(job: Job): boolean {
    const offerId = this.toOfferId(job);
    return offerId !== null && this.addingOfferIdsSet().has(offerId);
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

  private toOfferId(job: Job): number | null {
    const parsedId = Number(job.id);
    return Number.isFinite(parsedId) ? parsedId : null;
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
