import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, take } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { ApplicationsService } from '../../core/services/applications.service';
import { Application, ApplicationStatus } from '../../core/models/application.model';

import { ApplicationCardComponent } from './application-card.component';

@Component({
    selector: 'app-applications',
    standalone: true,
    imports: [CommonModule, FormsModule, ApplicationCardComponent],
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
        <app-application-card
          *ngFor="let app of applications()"
          [application]="app"
          (statusChanged)="updateStatus(app, $event)"
          (notesChanged)="app.notes = $event; updateNotes(app)"
          (deleteRequested)="deleteApplication($event)"
        ></app-application-card>
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

