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
  templateUrl: './applications.component.html',
  styleUrl: './applications.component.css'
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

