import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { FavoriteOffer } from '../../core/models/favorite-offer.model';
import { AuthService } from '../../core/services/auth.service';
import * as FavoritesActions from '../../store/favorites/favorites.actions';
import {
  selectFavoritesError,
  selectFavoritesItems,
  selectFavoritesLoading,
  selectRemovingFavoriteIds
} from '../../store/favorites/favorites.selectors';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="max-w-7xl mx-auto space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header class="flex flex-wrap items-end justify-between gap-6 border-b border-black/5 pb-8">
        <div class="space-y-2">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--gold-500)]">
            Ma Collection
          </p>
          <h1 class="font-display text-4xl font-bold tracking-tight text-[color:var(--ink-950)]">
            Offres Sauvegardées
          </h1>
          <p class="max-w-xl text-sm leading-relaxed text-[color:var(--ink-600)]">
            Retrouvez et gérez les opportunités que vous avez marquées pour plus tard.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <a
            class="group inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/80 px-5 py-2.5 text-xs font-bold text-[color:var(--ink-700)] shadow-sm transition-all hover:border-[color:var(--teal-600)] hover:bg-white"
            routerLink="/jobs"
          >
            <svg class="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Explorer d'autres offres
          </a>
        </div>
      </header>

      <div *ngIf="errorMessage()" class="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {{ errorMessage() }}
        </div>
      </div>

      <div *ngIf="loading()" class="flex h-64 items-center justify-center">
        <div class="h-10 w-10 animate-spin rounded-full border-4 border-[color:var(--teal-600)] border-t-transparent shadow-lg"></div>
      </div>

      <div *ngIf="!loading() && favorites().length === 0" class="flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-black/5 bg-white/40 py-20 px-6 text-center shadow-inner">
        <div class="relative mb-6">
           <div class="absolute inset-0 scale-150 blur-3xl rounded-full bg-[color:var(--gold-500)]/10 animate-pulse"></div>
           <svg class="relative h-20 w-20 text-[color:var(--ink-300)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
        </div>
        <h3 class="text-xl font-bold text-[color:var(--ink-950)]">Votre liste est vide</h3>
        <p class="mt-2 max-w-xs text-sm text-[color:var(--ink-500)]">
          C'est le moment idéal pour découvrir de nouvelles offres et les ajouter à vos favoris.
        </p>
        <button
          routerLink="/jobs"
          class="mt-8 rounded-full bg-[color:var(--ink-950)] px-8 py-3 text-sm font-bold text-white shadow-xl transition hover:bg-black hover:scale-105 active:scale-95"
        >
          Commencer la recherche
        </button>
      </div>

      <div *ngIf="!loading() && favorites().length > 0" class="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
        <div 
          class="glass-card group relative flex flex-col overflow-hidden rounded-[2rem] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" 
          *ngFor="let offer of favorites(); trackBy: trackById"
        >
          <div class="mb-4 flex items-start justify-between">
            <div class="flex-1">
              <p class="text-[10px] font-bold uppercase tracking-wider text-[color:var(--gold-500)]">
                {{ offer.company }}
              </p>
              <h2 class="mt-1 font-display text-xl font-bold leading-tight text-[color:var(--ink-950)] group-hover:text-[color:var(--teal-600)] transition-colors">
                {{ offer.title }}
              </h2>
            </div>
          </div>

          <div class="mb-4 flex flex-wrap gap-2 text-[10px]">
            <span class="inline-flex items-center rounded-full bg-[color:var(--mint-100)] px-2.5 py-1 font-medium text-[color:var(--teal-700)]">
              <svg class="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              {{ offer.location }}
            </span>
          </div>

          <div class="mt-auto space-y-4">
            <div class="flex items-center justify-between border-t border-black/5 pt-4">
              <span class="text-[10px] font-medium uppercase tracking-wider text-[color:var(--ink-400)]">
                Ajouté le {{ offer.datePublished | date: 'mediumDate' }}
              </span>
              <div class="flex items-center gap-2">
                <button
                  class="rounded-full border border-red-100 p-2 text-red-500 transition-all hover:bg-red-50 disabled:opacity-50"
                  type="button"
                  [disabled]="isRemoving(offer)"
                  (click)="remove(offer)"
                  [title]="isRemoving(offer) ? 'En cours...' : 'Retirer des favoris'"
                >
                  <svg *ngIf="!isRemoving(offer)" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                  <svg *ngIf="isRemoving(offer)" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                </button>
                <button
                  class="rounded-full bg-[color:var(--ink-950)] px-5 py-2 text-[10px] font-bold text-white shadow-sm transition hover:bg-black hover:scale-105 active:scale-95"
                  type="button"
                  [disabled]="!offer.url"
                  (click)="openOffer(offer.url)"
                >
                  Postuler
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class FavoritesComponent implements OnInit, OnDestroy {
  favorites = signal<FavoriteOffer[]>([]);
  loading = signal(false);
  errorMessage = signal('');
  removingIdsSet = signal(new Set<string>());
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly store: Store
  ) { }

  ngOnInit(): void {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.store.dispatch(FavoritesActions.loadFavorites({ userId: currentUser.id }));

    this.subscriptions.push(
      this.store.select(selectFavoritesItems).subscribe((favorites) => {
        this.favorites.set(favorites);
      }),
      this.store.select(selectFavoritesLoading).subscribe((loading) => {
        this.loading.set(loading);
      }),
      this.store.select(selectFavoritesError).subscribe((error) => {
        this.errorMessage.set(error ?? '');
      }),
      this.store.select(selectRemovingFavoriteIds).subscribe((ids) => {
        this.removingIdsSet.set(new Set(ids.map((id) => String(id))));
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  trackById(_: number, offer: FavoriteOffer): number | string {
    return offer.id;
  }

  openOffer(url: string): void {
    if (!url) {
      return;
    }
    window.open(url, '_blank', 'noopener');
  }

  remove(offer: FavoriteOffer): void {
    this.store.dispatch(FavoritesActions.removeFavorite({ favoriteId: offer.id }));
  }

  isRemoving(offer: FavoriteOffer): boolean {
    return this.removingIdsSet().has(String(offer.id));
  }
}
