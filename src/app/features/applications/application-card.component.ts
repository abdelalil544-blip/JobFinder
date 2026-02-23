import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Application, ApplicationStatus } from '../../core/models/application.model';

@Component({
  selector: 'app-application-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './application-card.component.html'
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
