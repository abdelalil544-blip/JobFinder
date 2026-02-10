import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { FavoriteOffer } from '../models/favorite-offer.model';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly apiUrl = 'http://localhost:3000/favoritesOffers';

  constructor(private readonly http: HttpClient) {}

  getByUser(userId: number): Observable<FavoriteOffer[]> {
    return this.http.get<FavoriteOffer[]>(`${this.apiUrl}?userId=${userId}`);
  }

  create(favorite: Omit<FavoriteOffer, 'id'>): Observable<FavoriteOffer> {
    return this.http.post<FavoriteOffer>(this.apiUrl, favorite);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
