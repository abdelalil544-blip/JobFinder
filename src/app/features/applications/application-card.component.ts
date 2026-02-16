import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Application, ApplicationStatus } from '../../core/models/application.model';

@Component({
    selector: 'app-application-card',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="glass-card group relative flex flex-col overflow-hidden rounded-[2rem] p-6 transition-all duration-300 hover:shadow-xl">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 mb-3">
            <span
              class="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors"
              [ngClass]="{
                'bg-amber-100 text-amber-700': application.status === 'en_attente',
                'bg-emerald-100 text-emerald-700': application.status === 'accepte',
                'bg-rose-100 text-rose-700': application.status === 'refuse'
              }"
            >
              {{ getStatusLabel(application.status) }}
            </span>
            <span class="text-[10px] font-medium text-[color:var(--ink-400)]">
              Le {{ application.dateAdded | date: 'mediumDate' }}
            </span>
          </div>
          
          <h3 class="font-display text-xl font-bold leading-tight text-[color:var(--ink-950)] group-hover:text-[color:var(--teal-600)] transition-colors truncate">
            {{ application.title }}
          </h3>
          <p class="mt-1 text-xs font-semibold text-[color:var(--teal-700)]">
            {{ application.company }} • {{ application.location }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <a
            [href]="application.url"
            target="_blank"
            rel="noopener"
            class="rounded-full border border-black/5 p-2.5 text-[color:var(--ink-600)] transition hover:bg-black/5 hover:text-[color:var(--teal-600)]"
            title="Consulter l'offre"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </a>
          <button
            (click)="deleteRequested.emit(application)"
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
                [ngModel]="application.status"
                (ngModelChange)="statusChanged.emit($event)"
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
              [(ngModel)]="application.notes"
              (blur)="notesChanged.emit(application.notes)"
              placeholder="Écrivez vos pensées ici..."
              rows="1"
              class="w-full rounded-2xl border border-black/5 bg-white/50 px-4 py-2 text-xs text-[color:var(--ink-700)] placeholder:text-[color:var(--ink-300)] focus:border-[color:var(--teal-600)] focus:outline-none focus:ring-4 focus:ring-[color:var(--teal-600)]/10 transition-all resize-none"
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ApplicationCardComponent {
    @Input({ required: true }) application!: Application;
    @Output() statusChanged = new EventEmitter<ApplicationStatus>();
    @Output() notesChanged = new EventEmitter<string | undefined>();
    @Output() deleteRequested = new EventEmitter<Application>();

    getStatusLabel(status: ApplicationStatus): string {
        switch (status) {
            case 'en_attente': return 'En attente';
            case 'accepte': return 'Accepté';
            case 'refuse': return 'Refusé';
            default: return 'Inconnu';
        }
    }
}
