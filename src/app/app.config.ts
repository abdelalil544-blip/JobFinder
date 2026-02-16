import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';

import { routes } from './app.routes';
import { FavoritesEffects } from './store/favorites/favorites.effects';
import { favoritesFeatureKey, favoritesReducer } from './store/favorites/favorites.reducer';
import { apiInterceptor } from './core/interceptors/api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([apiInterceptor])),
    provideRouter(routes),
    provideStore({
      [favoritesFeatureKey]: favoritesReducer
    }),
    provideEffects([FavoritesEffects])
  ]
};
