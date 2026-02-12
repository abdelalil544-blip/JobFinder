import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, switchMap, tap, throwError } from 'rxjs';

import { LoginPayload, RegisterPayload } from '../models/auth.model';
import { PublicUser, User } from '../models/user.model';
import { UsersService } from './users.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly storageKey = 'jobfinder_user';
  private readonly storage: Storage = localStorage;
  private readonly currentUserSubject = new BehaviorSubject<PublicUser | null>(
    this.getStoredUser()
  );

  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private readonly usersService: UsersService) {}

  get currentUser(): PublicUser | null {
    return this.currentUserSubject.value;
  }

  login(payload: LoginPayload): Observable<PublicUser> {
    const email = this.normalizeEmail(payload.email);
    const password = payload.password.trim();

    return this.usersService.getByCredentials(email, password).pipe(
      map((users) => {
        const user = users[0];
        if (!user) {
          throw new Error('Email ou mot de passe incorrect.');
        }
        return user;
      }),
      map((user) => this.setSession(user))
    );
  }

  register(payload: RegisterPayload): Observable<PublicUser> {
    const email = this.normalizeEmail(payload.email);
    const password = payload.password.trim();

    return this.usersService.getByEmail(email).pipe(
      switchMap((users) => {
        if (users.length > 0) {
          return throwError(() => new Error('Cet email est deja utilise.'));
        }
        return this.usersService.create({
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          email,
          password
        });
      }),
      map((user) => this.setSession(user))
    );
  }

  updateProfile(userId: number, updates: Partial<User>): Observable<PublicUser> {
    return this.usersService.update(userId, updates).pipe(
      tap((user) => {
        if (this.currentUser?.id === user.id) {
          this.setSession(user);
        }
      }),
      map((user) => this.toPublicUser(user))
    );
  }

  logout(): void {
    this.storage.removeItem(this.storageKey);
    this.currentUserSubject.next(null);
  }

  deleteAccount(userId: number): Observable<void> {
    return this.usersService.delete(userId).pipe(
      tap(() => this.logout())
    );
  }

  private setSession(user: User): PublicUser {
    const publicUser = this.toPublicUser(user);
    this.storage.setItem(this.storageKey, JSON.stringify(publicUser));
    this.currentUserSubject.next(publicUser);
    return publicUser;
  }

  private getStoredUser(): PublicUser | null {
    const raw = this.storage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as PublicUser;
    } catch {
      this.storage.removeItem(this.storageKey);
      return null;
    }
  }

  private toPublicUser(user: User): PublicUser {
    const { password, ...publicUser } = user;
    return publicUser;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
