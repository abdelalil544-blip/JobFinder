export type ApplicationStatus = 'en_attente' | 'accepte' | 'refuse';

export interface Application {
  id: number | string;
  userId: number | string;
  offerId: number | string;
  apiSource: 'themuse' | 'adzuna';
  title: string;
  company: string;
  location: string;
  url: string;
  status: ApplicationStatus;
  notes?: string;
  dateAdded: string;
}
