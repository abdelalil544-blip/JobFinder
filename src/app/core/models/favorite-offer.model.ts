export interface FavoriteOffer {
  id: number;
  userId: number;
  offerId: number;
  apiSource: 'themuse';
  title: string;
  company: string;
  location: string;
  url: string;
  datePublished: string;
}
