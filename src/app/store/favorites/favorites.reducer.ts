import { Action, createReducer, on } from '@ngrx/store';

import { FavoriteOffer } from '../../core/models/favorite-offer.model';
import * as FavoritesActions from './favorites.actions';

export const favoritesFeatureKey = 'favorites';

export interface FavoritesState {
  items: FavoriteOffer[];
  loading: boolean;
  error: string | null;
  loadedUserId: number | string | null;
  addingOfferIds: number[];
  removingFavoriteIds: Array<number | string>;
}

const initialState: FavoritesState = {
  items: [],
  loading: false,
  error: null,
  loadedUserId: null,
  addingOfferIds: [],
  removingFavoriteIds: []
};

const reducer = createReducer(
  initialState,
  on(FavoritesActions.loadFavorites, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(FavoritesActions.loadFavoritesSuccess, (state, { favorites, userId }) => ({
    ...state,
    items: favorites,
    loadedUserId: userId,
    loading: false,
    error: null,
    addingOfferIds: [],
    removingFavoriteIds: []
  })),
  on(FavoritesActions.loadFavoritesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(FavoritesActions.addFavorite, (state, { favorite }) => ({
    ...state,
    error: null,
    addingOfferIds: addUnique(state.addingOfferIds, favorite.offerId)
  })),
  on(FavoritesActions.addFavoriteSuccess, (state, { favorite }) => ({
    ...state,
    items: upsertFavorite(state.items, favorite),
    addingOfferIds: removeValue(state.addingOfferIds, favorite.offerId)
  })),
  on(FavoritesActions.addFavoriteDuplicate, (state, { offerId }) => ({
    ...state,
    addingOfferIds: removeValue(state.addingOfferIds, offerId)
  })),
  on(FavoritesActions.addFavoriteFailure, (state, { offerId, error }) => ({
    ...state,
    error,
    addingOfferIds: removeValue(state.addingOfferIds, offerId)
  })),
  on(FavoritesActions.removeFavorite, (state, { favoriteId }) => ({
    ...state,
    error: null,
    removingFavoriteIds: addUnique(state.removingFavoriteIds, favoriteId)
  })),
  on(FavoritesActions.removeFavoriteSuccess, (state, { favoriteId }) => ({
    ...state,
    items: state.items.filter((item) => String(item.id) !== String(favoriteId)),
    removingFavoriteIds: removeValue(state.removingFavoriteIds, favoriteId)
  })),
  on(FavoritesActions.removeFavoriteFailure, (state, { favoriteId, error }) => ({
    ...state,
    error,
    removingFavoriteIds: removeValue(state.removingFavoriteIds, favoriteId)
  })),
  on(FavoritesActions.clearFavorites, () => initialState)
);

export function favoritesReducer(state: FavoritesState | undefined, action: Action): FavoritesState {
  return reducer(state, action);
}

function upsertFavorite(items: FavoriteOffer[], favorite: FavoriteOffer): FavoriteOffer[] {
  const duplicateIndex = items.findIndex((item) => item.offerId === favorite.offerId);

  if (duplicateIndex >= 0) {
    return items;
  }

  return [favorite, ...items];
}

function addUnique<T extends number | string>(items: T[], value: T): T[] {
  return items.some((item) => String(item) === String(value)) ? items : [...items, value];
}

function removeValue<T extends number | string>(items: T[], value: T): T[] {
  return items.filter((item) => String(item) !== String(value));
}
