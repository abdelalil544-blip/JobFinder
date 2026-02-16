import { createFeatureSelector, createSelector } from '@ngrx/store';

import { FavoritesState, favoritesFeatureKey } from './favorites.reducer';

export const selectFavoritesState = createFeatureSelector<FavoritesState>(favoritesFeatureKey);

export const selectFavoritesItems = createSelector(selectFavoritesState, (state) => state.items);

export const selectFavoritesLoading = createSelector(selectFavoritesState, (state) => state.loading);

export const selectFavoritesError = createSelector(selectFavoritesState, (state) => state.error);

export const selectFavoriteOfferIds = createSelector(selectFavoritesItems, (items) =>
  items.map((item) => item.offerId)
);

export const selectAddingOfferIds = createSelector(
  selectFavoritesState,
  (state) => state.addingOfferIds
);

export const selectRemovingFavoriteIds = createSelector(
  selectFavoritesState,
  (state) => state.removingFavoriteIds
);

export const selectIsFavoriteOffer = (offerId: number) =>
  createSelector(selectFavoriteOfferIds, (offerIds) => offerIds.includes(offerId));

export const selectIsAddingFavorite = (offerId: number) =>
  createSelector(selectFavoritesState, (state) => state.addingOfferIds.includes(offerId));

export const selectIsRemovingFavorite = (favoriteId: number | string) =>
  createSelector(selectFavoritesState, (state) =>
    state.removingFavoriteIds.some((id) => String(id) === String(favoriteId))
  );
