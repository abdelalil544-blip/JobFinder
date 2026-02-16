import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, of, switchMap, withLatestFrom } from 'rxjs';

import { FavoriteOffer } from '../../core/models/favorite-offer.model';
import { AuthService } from '../../core/services/auth.service';
import { FavoritesService } from '../../core/services/favorites.service';
import * as FavoritesActions from './favorites.actions';
import { selectFavoritesItems } from './favorites.selectors';

@Injectable()
export class FavoritesEffects {
  private readonly actions$ = inject(Actions);
  private readonly favoritesService = inject(FavoritesService);
  private readonly authService = inject(AuthService);
  private readonly store = inject(Store);

  readonly loadFavorites$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FavoritesActions.loadFavorites),
      switchMap(({ userId }) => {
        return this.favoritesService.getByUser(userId).pipe(
          map((favorites) => FavoritesActions.loadFavoritesSuccess({ userId, favorites })),
          catchError((error: { message?: string }) =>
            of(
              FavoritesActions.loadFavoritesFailure({
                error: error?.message || 'Impossible de charger les favoris.'
              })
            )
          )
        );
      })
    )
  );

  readonly addFavorite$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FavoritesActions.addFavorite),
      withLatestFrom(this.store.select(selectFavoritesItems)),
      switchMap(([{ userId, favorite }, favorites]) => {
        const currentUser = this.authService.currentUser;
        const isAuthenticated =
          !!currentUser && String(currentUser.id) === String(userId) && String(favorite.userId) === String(userId);

        if (!isAuthenticated) {
          return of(
            FavoritesActions.addFavoriteFailure({
              offerId: favorite.offerId,
              error: 'Vous devez etre connecte pour ajouter un favori.'
            })
          );
        }

        const alreadyInState = this.hasDuplicate(favorites, favorite);
        if (alreadyInState) {
          return of(FavoritesActions.addFavoriteDuplicate({ offerId: favorite.offerId }));
        }

        return this.favoritesService.getByUser(userId).pipe(
          switchMap((serverFavorites) => {
            const alreadyInServer = this.hasDuplicate(serverFavorites, favorite);
            if (alreadyInServer) {
              return of(FavoritesActions.addFavoriteDuplicate({ offerId: favorite.offerId }));
            }

            return this.favoritesService.create(favorite).pipe(
              map((createdFavorite) => FavoritesActions.addFavoriteSuccess({ favorite: createdFavorite }))
            );
          }),
          catchError((error: { message?: string }) =>
            of(
              FavoritesActions.addFavoriteFailure({
                offerId: favorite.offerId,
                error: error?.message || "Impossible d'ajouter cette offre aux favoris."
              })
            )
          )
        );
      })
    )
  );

  readonly removeFavorite$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FavoritesActions.removeFavorite),
      switchMap(({ favoriteId }) => {
        return this.favoritesService.delete(favoriteId).pipe(
          map(() => FavoritesActions.removeFavoriteSuccess({ favoriteId })),
          catchError((error: { message?: string }) =>
            of(
              FavoritesActions.removeFavoriteFailure({
                favoriteId,
                error: error?.message || 'Impossible de supprimer ce favori.'
              })
            )
          )
        );
      })
    )
  );

  private hasDuplicate(favorites: FavoriteOffer[], favorite: Omit<FavoriteOffer, 'id'>): boolean {
    return favorites.some(
      (item) => item.offerId === favorite.offerId && String(item.userId) === String(favorite.userId)
    );
  }
}
