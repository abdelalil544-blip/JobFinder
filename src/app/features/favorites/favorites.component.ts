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

import { FavoriteCardComponent } from './favorite-card.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, FavoriteCardComponent],
  templateUrl: './favorites.component.html'
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
