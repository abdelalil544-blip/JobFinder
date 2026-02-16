export interface FavoriteOffer {
  id: number | string;
  userId: number | string;
  offerId: number;
  apiSource: 'themuse';
  title: string;
  company: string;
  location: string;
  url: string;
  datePublished: string;
}
