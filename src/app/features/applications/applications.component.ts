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
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <header class="flex flex-wrap items-end justify-between gap-6 border-b border-black/5 pb-8">
        <div class="space-y-2">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--teal-600)]">
            Tableau de bord
          </p>
          <h1 class="font-display text-4xl font-bold tracking-tight text-[color:var(--ink-950)]">
            Mes Candidatures
          </h1>
          <p class="max-w-xl text-sm leading-relaxed text-[color:var(--ink-600)]">
            Suivez l'état de vos demandes et gardez des notes sur chaque opportunité.
          </p>
        </div>
      </header>

      <div *ngIf="loading()" class="flex h-64 items-center justify-center">
        <div class="h-10 w-10 animate-spin rounded-full border-4 border-[color:var(--teal-600)] border-t-transparent shadow-lg"></div>
      </div>

      <div *ngIf="!loading() && applications().length === 0" class="flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-black/5 bg-white/40 py-20 px-6 text-center shadow-inner">
        <div class="relative mb-6">
           <div class="absolute inset-0 scale-150 blur-3xl rounded-full bg-[color:var(--teal-500)]/10 animate-pulse"></div>
           <svg class="relative h-20 w-20 text-[color:var(--ink-300)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        </div>
        <h3 class="text-xl font-bold text-[color:var(--ink-950)]">Aucune candidature suivie</h3>
        <p class="mt-2 max-w-xs text-sm text-[color:var(--ink-500)]">
          Commencez par explorer les offres et cliquez sur "Suivre cette candidature".
        </p>
        <button
          (click)="browseJobs()"
          class="mt-8 rounded-full bg-[color:var(--ink-950)] px-8 py-3 text-sm font-bold text-white shadow-xl transition hover:bg-black hover:scale-105 active:scale-95"
        >
          Parcourir les offres
        </button>
      </div>

      <div *ngIf="!loading() && applications().length > 0" class="grid gap-6 md:grid-cols-2">
        <div
          *ngFor="let app of applications()"
          class="glass-card group relative flex flex-col overflow-hidden rounded-[2rem] p-6 transition-all duration-300 hover:shadow-xl"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-3">
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors"
                  [ngClass]="{
                    'bg-amber-100 text-amber-700': app.status === 'en_attente',
                    'bg-emerald-100 text-emerald-700': app.status === 'accepte',
                    'bg-rose-100 text-rose-700': app.status === 'refuse'
                  }"
                >
                  {{ getStatusLabel(app.status) }}
                </span>
                <span class="text-[10px] font-medium text-[color:var(--ink-400)]">
                  Le {{ app.dateAdded | date: 'mediumDate' }}
                </span>
              </div>
              
              <h3 class="font-display text-xl font-bold leading-tight text-[color:var(--ink-950)] group-hover:text-[color:var(--teal-600)] transition-colors truncate">
                {{ app.title }}
              </h3>
              <p class="mt-1 text-xs font-semibold text-[color:var(--teal-700)]">
                {{ app.company }} • {{ app.location }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <a
                [href]="app.url"
                target="_blank"
                rel="noopener"
                class="rounded-full border border-black/5 p-2.5 text-[color:var(--ink-600)] transition hover:bg-black/5 hover:text-[color:var(--teal-600)]"
                title="Consulter l'offre"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </a>
              <button
                (click)="deleteApplication(app)"
                class="rounded-full border border-black/5 p-2.5 text-rose-400 transition hover:bg-rose-50 hover:text-rose-600"
                title="Retirer du suivi"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>

          <div class="mt-6 space-y-4 pt-6 border-t border-black/5">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="sm:col-span-1">
                <label class="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-400)]">
                  État
                </label>
                <div class="relative">
                  <select
                    [ngModel]="app.status"
                    (ngModelChange)="updateStatus(app, $event)"
                    class="w-full appearance-none rounded-2xl border border-black/5 bg-white/50 px-3 py-2 text-xs font-semibold text-[color:var(--ink-700)] focus:border-[color:var(--teal-600)] focus:outline-none focus:ring-4 focus:ring-[color:var(--teal-600)]/10"
                  >
                    <option value="en_attente">⏳ En attente</option>
                    <option value="accepte">✅ Accepté</option>
                    <option value="refuse">❌ Refusé</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[color:var(--ink-400)]">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </div>
              </div>

              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-400)]">
                  Notes privées
                </label>
                <textarea
                  [(ngModel)]="app.notes"
                  (blur)="updateNotes(app)"
                  placeholder="Écrivez vos pensées ici..."
                  rows="1"
                  class="w-full rounded-2xl border border-black/5 bg-white/50 px-4 py-2 text-xs text-[color:var(--ink-700)] placeholder:text-[color:var(--ink-300)] focus:border-[color:var(--teal-600)] focus:outline-none focus:ring-4 focus:ring-[color:var(--teal-600)]/10 transition-all resize-none"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <p class="mt-8 text-center text-xs text-red-500 font-medium" *ngIf="errorMessage()">
        <svg class="inline-block mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        {{ errorMessage() }}
      </p>
    </div>
  `,
    styles: [`
    :host {
      display: block;
      min-height: calc(100vh - 120px);
    }
    textarea:focus {
      rows: 3;
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

        this.applicationsService.update(app.id, { status: newStatus }).subscribe({
            next: (updated) => {
                app.status = updated.status;
                // Trigger signal update by setting the same array (shallow copy or re-set)
                this.applications.set([...this.applications()]);
            },
            error: () => this.errorMessage.set('Erreur lors de la mise à jour du statut.')
        });
    }

    updateNotes(app: Application): void {
        this.applicationsService.update(app.id, { notes: app.notes }).subscribe({
            next: () => {
                this.applications.set([...this.applications()]);
            },
            error: () => this.errorMessage.set('Erreur lors de l\'enregistrement des notes.')
        });
    }

    deleteApplication(app: Application): void {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette candidature de votre suivi ?')) return;

        this.applicationsService.delete(app.id).subscribe({
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

