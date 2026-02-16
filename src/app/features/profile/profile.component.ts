import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { take } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html'
})
export class ProfileComponent {
  errorMessage = signal('');
  successMessage = signal('');

  readonly form;

  private readonly userId: number;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.form = this.formBuilder.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]]
    });

    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      this.userId = 0;
      this.router.navigate(['/auth/login']);
      return;
    }

    this.userId = currentUser.id;
    this.form.patchValue({
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email
    });
  }

  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.form.invalid || !this.userId) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, password } = this.form.getRawValue();
    const updates = {
      firstName: (firstName ?? '').trim(),
      lastName: (lastName ?? '').trim(),
      email: (email ?? '').trim(),
      ...(password ? { password } : {})
    };

    this.authService
      .updateProfile(this.userId, updates)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.successMessage.set('Profil mis à jour avec succès.');
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
        }
      });
  }

  onDelete(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.userId) {
      return;
    }

    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.');
    if (!confirmed) {
      return;
    }

    this.authService
      .deleteAccount(this.userId)
      .pipe(take(1))
      .subscribe({
        next: () => this.router.navigate(['/auth/register']),
        error: (error: Error) => {
          this.errorMessage.set(error.message);
        }
      });
  }
}
