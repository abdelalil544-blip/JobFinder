import { createAction, props } from '@ngrx/store';

import { FavoriteOffer } from '../../core/models/favorite-offer.model';

export const loadFavorites = createAction(
  '[Favorites] Load Favorites',
  props<{ userId: number | string }>()
);

export const loadFavoritesSuccess = createAction(
  '[Favorites] Load Favorites Success',
  props<{ userId: number | string; favorites: FavoriteOffer[] }>()
);

export const loadFavoritesFailure = createAction(
  '[Favorites] Load Favorites Failure',
  props<{ error: string }>()
);

export const addFavorite = createAction(
  '[Favorites] Add Favorite',
  props<{ userId: number | string; favorite: Omit<FavoriteOffer, 'id'> }>()
);

export const addFavoriteSuccess = createAction(
  '[Favorites] Add Favorite Success',
  props<{ favorite: FavoriteOffer }>()
);

export const addFavoriteDuplicate = createAction(
  '[Favorites] Add Favorite Duplicate',
  props<{ offerId: number }>()
);

export const addFavoriteFailure = createAction(
  '[Favorites] Add Favorite Failure',
  props<{ offerId: number; error: string }>()
);

export const removeFavorite = createAction(
  '[Favorites] Remove Favorite',
  props<{ favoriteId: number | string }>()
);

export const removeFavoriteSuccess = createAction(
  '[Favorites] Remove Favorite Success',
  props<{ favoriteId: number | string }>()
);

export const removeFavoriteFailure = createAction(
  '[Favorites] Remove Favorite Failure',
  props<{ favoriteId: number | string; error: string }>()
);

export const clearFavorites = createAction('[Favorites] Clear Favorites');
