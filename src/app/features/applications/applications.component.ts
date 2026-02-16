import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, take } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { ApplicationsService } from '../../core/services/applications.service';
import { Application, ApplicationStatus } from '../../core/models/application.model';

@Component({
    selector: 'app-applications',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="font-display text-3xl font-bold tracking-tight text-[color:var(--ink-950)]">
          Suivi des Candidatures
        </h1>
        <p class="mt-2 text-sm text-[color:var(--ink-600)]">
          Gérez et suivez l'avancement de vos candidatures envoyées.
        </p>
      </div>

      <div *ngIf="loading()" class="flex h-64 items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--teal-600)] border-t-transparent"></div>
      </div>

      <div *ngIf="!loading() && applications().length === 0" class="rounded-3xl border-2 border-dashed border-black/10 p-12 text-center">
        <p class="text-[color:var(--ink-500)]">Vous n'avez pas encore de candidatures suivies.</p>
        <button
          (click)="browseJobs()"
          class="mt-4 inline-flex items-center rounded-full bg-[color:var(--teal-600)] px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--teal-700)]"
        >
          Parcourir les offres
        </button>
      </div>

      <div *ngIf="!loading() && applications().length > 0" class="grid gap-6">
        <div
          *ngFor="let app of applications()"
          class="group relative overflow-hidden rounded-3xl border border-black/5 bg-white/80 p-6 shadow-sm transition-all hover:shadow-md"
        >
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="flex-1 min-w-[280px]">
              <div class="flex items-center gap-3">
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  [ngClass]="{
                    'bg-yellow-100 text-yellow-800': app.status === 'en_attente',
                    'bg-green-100 text-green-800': app.status === 'accepte',
                    'bg-red-100 text-red-800': app.status === 'refuse'
                  }"
                >
                  {{ getStatusLabel(app.status) }}
                </span>
                <span class="text-xs text-[color:var(--ink-400)]">
                  Ajouté le {{ app.dateAdded | date: 'mediumDate' }}
                </span>
              </div>
              
              <h3 class="mt-3 font-display text-xl leading-tight text-[color:var(--ink-950)]">
                {{ app.title }}
              </h3>
              <p class="mt-1 text-sm font-medium text-[color:var(--teal-700)]">
                {{ app.company }} • {{ app.location }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <a
                [href]="app.url"
                target="_blank"
                rel="noopener"
                class="rounded-full border border-black/10 p-2 text-[color:var(--ink-600)] transition hover:bg-black/5"
                title="Voir l'offre originale"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </a>
              <button
                (click)="deleteApplication(app)"
                class="rounded-full border border-black/10 p-2 text-red-600 transition hover:bg-red-50"
                title="Supprimer du suivi"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            </div>
          </div>

          <div class="mt-6 flex flex-wrap gap-4 border-t border-black/5 pt-6">
            <div class="w-full sm:w-48">
              <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-[color:var(--ink-500)]">
                Statut
              </label>
              <select
                [ngModel]="app.status"
                (ngModelChange)="updateStatus(app, $event)"
                class="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[color:var(--ink-700)] focus:border-[color:var(--teal-600)] focus:ring-1 focus:ring-[color:var(--teal-600)]"
              >
                <option value="en_attente">En attente</option>
                <option value="accepte">Accepté</option>
                <option value="refuse">Refusé</option>
              </select>
            </div>

            <div class="flex-1">
              <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-[color:var(--ink-500)]">
                Notes personnelles
              </label>
              <textarea
                [(ngModel)]="app.notes"
                (blur)="updateNotes(app)"
                placeholder="Ajouter des notes sur cette candidature..."
                rows="2"
                class="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[color:var(--ink-700)] focus:border-[color:var(--teal-600)] focus:ring-1 focus:ring-[color:var(--teal-600)]"
              ></textarea>
            </div>
          </div>
        </div>
      </div>
      
      <p class="mt-8 text-center text-xs text-[color:var(--ink-400)]" *ngIf="errorMessage()">
        {{ errorMessage() }}
      </p>
    </div>
  `,
    styles: [`
    :host {
      display: block;
      min-height: calc(100vh - 80px);
      background-color: var(--ink-50);
    }
  `]
})
export class ApplicationsComponent implements OnInit {
    applications = signal<Application[]>([]);
    loading = signal(true);
    errorMessage = signal('');

    constructor(
        private readonly authService: AuthService,
        private readonly applicationsService: ApplicationsService,
        private readonly router: Router
    ) { }

    ngOnInit(): void {
        const user = this.authService.currentUser;
        if (!user) {
            this.router.navigate(['/auth/login']);
            return;
        }
        this.loadApplications(user.id);
    }

    loadApplications(userId: number | string): void {
        this.loading.set(true);
        this.applicationsService
            .getByUser(Number(userId))
            .pipe(
                take(1),
                finalize(() => this.loading.set(false))
            )
            .subscribe({
                next: (apps) => this.applications.set(apps.sort((a, b) =>
                    new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
                )),
                error: (err) => this.errorMessage.set('Impossible de charger vos candidatures.')
            });
    }

    getStatusLabel(status: ApplicationStatus): string {
        switch (status) {
            case 'en_attente': return 'En attente';
            case 'accepte': return 'Accepté';
            case 'refuse': return 'Refusé';
            default: return 'Inconnu';
        }
    }

    updateStatus(app: Application, newStatus: ApplicationStatus): void {
        if (app.status === newStatus) return;

        this.applicationsService.update(Number(app.id), { status: newStatus }).subscribe({
            next: (updated) => {
                app.status = updated.status;
                // Trigger signal update by setting the same array (shallow copy or re-set)
                this.applications.set([...this.applications()]);
            },
            error: () => this.errorMessage.set('Erreur lors de la mise à jour du statut.')
        });
    }

    updateNotes(app: Application): void {
        this.applicationsService.update(Number(app.id), { notes: app.notes }).subscribe({
            next: () => {
                this.applications.set([...this.applications()]);
            },
            error: () => this.errorMessage.set('Erreur lors de l\'enregistrement des notes.')
        });
    }

    deleteApplication(app: Application): void {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette candidature de votre suivi ?')) return;

        this.applicationsService.delete(Number(app.id)).subscribe({
            next: () => {
                this.applications.set(this.applications().filter(a => a.id !== app.id));
            },
            error: () => this.errorMessage.set('Erreur lors de la suppression.')
        });
    }

    browseJobs(): void {
        this.router.navigate(['/jobs']);
    }
}

