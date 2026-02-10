import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Application } from '../models/application.model';

@Injectable({
  providedIn: 'root'
})
export class ApplicationsService {
  private readonly apiUrl = 'http://localhost:3000/applications';

  constructor(private readonly http: HttpClient) {}

  getByUser(userId: number): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.apiUrl}?userId=${userId}`);
  }

  create(application: Omit<Application, 'id'>): Observable<Application> {
    return this.http.post<Application>(this.apiUrl, application);
  }

  update(id: number, application: Partial<Application>): Observable<Application> {
    return this.http.patch<Application>(`${this.apiUrl}/${id}`, application);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
