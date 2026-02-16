import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
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
    <section class="space-y-6">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--gold-500)]">
            Favoris
          </p>
          <h1 class="font-display text-3xl text-[color:var(--ink-950)]">Vos opportunites gardees</h1>
          <p class="text-sm text-[color:var(--ink-700)]">
            Retrouvez toutes les offres que vous souhaitez suivre.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <a
            class="rounded-2xl border border-black/10 bg-white/80 px-4 py-2 text-xs font-semibold text-[color:var(--ink-700)] shadow-sm transition hover:border-[color:var(--teal-600)]"
            routerLink="/jobs"
          >
            Voir les offres
          </a>
          <a
            class="rounded-2xl bg-[color:var(--teal-600)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[color:var(--teal-700)]"
            routerLink="/applications"
          >
            Mes candidatures
          </a>
          <a
            class="rounded-2xl border border-black/10 bg-white/80 px-4 py-2 text-xs font-semibold text-[color:var(--ink-700)] shadow-sm transition hover:border-[color:var(--teal-600)]"
            routerLink="/profile"
          >
            Mon profil
          </a>
        </div>
      </header>

      <p class="text-sm text-[color:#b42318]" *ngIf="errorMessage">{{ errorMessage }}</p>
      <p class="text-sm text-[color:var(--ink-700)]" *ngIf="loading">Chargement des favoris...</p>

      <div class="grid gap-5 md:grid-cols-2">
        <div class="glass-card rounded-3xl p-5" *ngFor="let offer of favorites; trackBy: trackById">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-display text-lg text-[color:var(--ink-950)]">{{ offer.title }}</h2>
              <p class="text-sm text-[color:var(--ink-700)]">{{ offer.company }} · {{ offer.location }}</p>
            </div>
            <span class="rounded-full bg-[color:var(--mint-100)] px-3 py-1 text-xs font-semibold text-[color:var(--teal-700)]">
              {{ offer.apiSource }}
            </span>
          </div>
          <p class="mt-4 text-sm text-[color:var(--ink-700)]">
            Offre sauvegardee pour postuler rapidement.
          </p>
          <div class="mt-5 flex items-center gap-3">
            <button
              class="rounded-2xl bg-[color:var(--teal-600)] px-4 py-2 text-xs font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              [disabled]="!offer.url"
              (click)="openOffer(offer.url)"
            >
              Voir l'offre
            </button>
            <button
              class="rounded-2xl border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--ink-700)] disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              [disabled]="isRemoving(offer)"
              (click)="remove(offer)"
            >
              {{ isRemoving(offer) ? 'Suppression...' : 'Retirer' }}
            </button>
          </div>
        </div>

        <div
          class="rounded-3xl border border-dashed border-black/20 bg-white/60 p-6 text-center text-sm text-[color:var(--ink-700)]"
          *ngIf="favorites.length === 0 && !errorMessage && !loading"
        >
          Les prochaines offres en favoris apparaitront ici.
        </div>
      </div>
    </section>
  `
})
export class FavoritesComponent implements OnInit, OnDestroy {
  favorites: FavoriteOffer[] = [];
  loading = false;
  errorMessage = '';
  private removingIdsSet = new Set<string>();
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly store: Store
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.store.dispatch(FavoritesActions.loadFavorites({ userId: currentUser.id }));

    this.subscriptions.push(
      this.store.select(selectFavoritesItems).subscribe((favorites) => {
        this.favorites = favorites;
      }),
      this.store.select(selectFavoritesLoading).subscribe((loading) => {
        this.loading = loading;
      }),
      this.store.select(selectFavoritesError).subscribe((error) => {
        this.errorMessage = error ?? '';
      }),
      this.store.select(selectRemovingFavoriteIds).subscribe((ids) => {
        this.removingIdsSet = new Set(ids.map((id) => String(id)));
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
    return this.removingIdsSet.has(String(offer.id));
  }
}
