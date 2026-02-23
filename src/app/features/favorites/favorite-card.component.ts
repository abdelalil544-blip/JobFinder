import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FavoriteOffer } from '../../core/models/favorite-offer.model';

@Component({
  selector: 'app-favorite-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favorite-card.component.html'
})
export class FavoriteCardComponent {
  @Input({ required: true }) offer!: FavoriteOffer;
  @Input() removing = false;
  @Output() removeRequested = new EventEmitter<FavoriteOffer>();
  @Output() openRequested = new EventEmitter<string>();
}
