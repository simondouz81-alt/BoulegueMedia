export interface Event {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  start_date: string;
  end_date?: string;
  location: string;
  latitude: number;
  longitude: number;
  category: 'festival' | 'concert' | 'exposition' | 'conference' | 'atelier' | 'autre';
  price?: number;
  organizer: string;
  website_url?: string;
  contact_email?: string;
  created_at: string;
  updated_at: string;
}
