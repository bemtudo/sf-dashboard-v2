export interface Event {
  id: string;
  title: string;
  date: string;
  time?: string;
  time_text?: string; // Time information from backend (e.g., "8:00PM / 9:00PM")
  location?: string;
  cost?: string;
  url?: string;
  source: string;
  venue: string;
  scrapedAt: string;
  description?: string;
  category?: string;
  screen?: string; // Screen information (e.g., "Big Roxie", "Little Roxie")
  image_url?: string; // Event image URL
}

export interface Venue {
  id: string;
  name: string;
  category: string;
  url: string;
  events: Event[];
  analysis?: any; // Backend analysis results
  status?: 'pending-analysis' | 'analysis-complete' | 'scraper-ready' | 'scraper-in-development';
}