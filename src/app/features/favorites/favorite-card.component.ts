import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FavoriteOffer } from '../../core/models/favorite-offer.model';

@Component({
    selector: 'app-favorite-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div 
      class="glass-card group relative flex flex-col overflow-hidden rounded-[2rem] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" 
    >
      <div class="mb-4 flex items-start justify-between">
        <div class="flex-1">
          <p class="text-[10px] font-bold uppercase tracking-wider text-[color:var(--gold-500)]">
            {{ offer.company }}
          </p>
          <h2 class="mt-1 font-display text-xl font-bold leading-tight text-[color:var(--ink-950)] group-hover:text-[color:var(--teal-600)] transition-colors">
            {{ offer.title }}
          </h2>
        </div>
      </div>

      <div class="mb-4 flex flex-wrap gap-2 text-[10px]">
        <span class="inline-flex items-center rounded-full bg-[color:var(--mint-100)] px-2.5 py-1 font-medium text-[color:var(--teal-700)]">
          <svg class="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          {{ offer.location }}
        </span>
      </div>

      <div class="mt-auto space-y-4">
        <div class="flex items-center justify-between border-t border-black/5 pt-4">
          <span class="text-[10px] font-medium uppercase tracking-wider text-[color:var(--ink-400)]">
            Ajouté le {{ offer.datePublished | date: 'mediumDate' }}
          </span>
          <div class="flex items-center gap-2">
            <button
              class="rounded-full border border-red-100 p-2 text-red-500 transition-all hover:bg-red-50 disabled:opacity-50"
              type="button"
              [disabled]="removing"
              (click)="removeRequested.emit(offer)"
              [title]="removing ? 'En cours...' : 'Retirer des favoris'"
            >
              <svg *ngIf="!removing" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              <svg *ngIf="removing" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </button>
            <button
              class="rounded-full bg-[color:var(--ink-950)] px-5 py-2 text-[10px] font-bold text-white shadow-sm transition hover:bg-black hover:scale-105 active:scale-95"
              type="button"
              [disabled]="!offer.url"
              (click)="openRequested.emit(offer.url)"
            >
              Postuler
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class FavoriteCardComponent {
    @Input({ required: true }) offer!: FavoriteOffer;
    @Input() removing = false;
    @Output() removeRequested = new EventEmitter<FavoriteOffer>();
    @Output() openRequested = new EventEmitter<string>();
}
