export interface Event {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  cost?: string;
  url?: string;
  source: string;
  venue: string;
  scrapedAt: string;
  description?: string;
  category?: string;
  screen?: string; // Screen information (e.g., "Big Roxie", "Little Roxie")
}

export interface Venue {
  id: string;
  name: string;
  category: string;
  url: string;
  events: Event[];
}