import { Event } from '../types/Event';

// Interface matching your existing scraper output
interface ScrapedEvent {
  title: string;
  description?: string;
  date_start?: string;
  location?: string;
  source: string;
  source_url?: string;
  category?: string;
  price?: string;
  image_url?: string;
}

class EventScraper {
  private static websites: { [key: string]: { url: string; category: string; venue: string }[] } = {};
  private static scrapingServiceUrl = 'http://localhost:3002'; // Dedicated scraping service

  static initialize() {
    // Initialize with real SF venue websites that match your existing scrapers
    EventScraper.websites = {
      comedy: [
        { url: 'https://www.punchlinecomedyclub.com/events', category: 'comedy', venue: 'Punchline Comedy Club' },
        { url: 'https://www.cobbscomedyclub.com/events', category: 'comedy', venue: 'Cobb\'s Comedy Club' }
      ],
      education: [
        { url: 'https://sfpl.org/events', category: 'education', venue: 'San Francisco Public Library' }
      ],
      music: [
        { url: 'https://www.gamh.com/events', category: 'music', venue: 'Great American Music Hall' },
        { url: 'https://www.thechapelsf.com/events', category: 'music', venue: 'The Chapel' },
        { url: 'https://www.apeconcerts.com/events', category: 'music', venue: 'APE Concerts' }
      ],
      sports: [
        { url: 'https://www.strava.com/clubs/san-francisco', category: 'sports', venue: 'Strava SF Club' },
        { url: 'https://www.meetup.com/find/?source=EVENTS&location=us--ca--san-francisco&distance=twentyFiveMiles&sort=recommended&eventType=inPerson&categoryId=546', category: 'sports', venue: 'Cycling Groups SF' }
      ],
      food: [
        { url: 'https://ferrybuildingmarketplace.com/events', category: 'food', venue: 'Ferry Building' },
        { url: 'https://www.offthegrid.com/events', category: 'food', venue: 'Off the Grid' }
      ],
      tech: [
        { url: 'https://www.meetup.com/find/?source=EVENTS&location=us--ca--san-francisco&distance=twentyFiveMiles&sort=recommended&eventType=inPerson', category: 'tech', venue: 'Tech Meetups SF' }
      ]
    };
  }

  static async scrapeAllSources(): Promise<Event[]> {
    console.log('EventScraper: Starting to scrape events...');
    
    try {
      // First, try to fetch from the dedicated scraping service
      console.log('🔄 Attempting to fetch from dedicated scraping service...');
      
      const response = await fetch('http://localhost:3002/api/events');
      
      if (response.ok) {
        console.log('💚 Scraping service is healthy, fetching events...');
        const backendEvents = await response.json();
        console.log(`📊 Scraping service returned ${backendEvents.length} events`);
        
        if (backendEvents.length > 0) {
          console.log('✅ Using events from enhanced service (filtered for quality)');
          // Convert backend format to frontend format
          const convertedEvents: Event[] = backendEvents.map((backendEvent: any) => {
            // Extract venue name from location (e.g., "Roxie Theater, San Francisco" -> "Roxie Theater")
            let venueName = backendEvent.venue;
            if (!venueName && backendEvent.location) {
              venueName = backendEvent.location.split(',')[0].trim();
            }
            if (!venueName) {
              venueName = backendEvent.source || 'Unknown Venue';
            }
            
            return {
              id: backendEvent.id?.toString() || `${backendEvent.source}-${Date.now()}-${Math.random()}`,
              title: backendEvent.title,
              date: backendEvent.date_start || backendEvent.date,
              time: backendEvent.time,
              location: backendEvent.location || 'Roxie Theater, San Francisco',
              cost: backendEvent.price || backendEvent.cost,
              url: backendEvent.source_url || backendEvent.url,
              source: backendEvent.source,
              venue: venueName, // Use extracted venue name, not full location
              scrapedAt: new Date().toISOString(),
              description: backendEvent.description,
              category: backendEvent.category
            };
          });
          return convertedEvents;
        } else {
          console.log('📭 Backend returned 0 events - this means successful filtering, not failure');
    return [];
        }
      } else {
        console.log('⚠️ Backend service unavailable, falling back to browser scraping...');
        // Fall back to browser scraping only if backend is genuinely unavailable
        return await EventScraper.scrapeWebsite('https://example.com');
      }
    } catch (error) {
      console.error('❌ Error fetching from backend service:', error);
      console.log('🔄 Falling back to browser scraping...');
      // Only fall back to browser scraping if there's a network error
      return await EventScraper.scrapeWebsite('https://example.com');
    }
  }

  // Reset the database when there are constraint errors
  static async resetDatabase(): Promise<void> {
    try {
      console.log('🔄 Resetting database to resolve constraint errors...');
      const { default: EventStorage } = await import('./EventStorage');
      await EventStorage.forceResetDatabase();
      console.log('✅ Database reset completed');
    } catch (error) {
      console.error('❌ Failed to reset database:', error);
    }
  }

  // Fetch events from your dedicated scraping service
  private static async fetchFromScrapingService(): Promise<Omit<Event, 'id' | 'scrapedAt'>[]> {
    try {
      // First check if service is healthy
      const healthResponse = await fetch(`${this.scrapingServiceUrl}/health`);
      if (!healthResponse.ok) {
        throw new Error(`Scraping service health check failed: ${healthResponse.status}`);
      }
      
      console.log('💚 Scraping service is healthy, fetching events...');
      
      // Get events from the service
      const response = await fetch(`${this.scrapingServiceUrl}/api/events`);
      
      if (!response.ok) {
        throw new Error(`Scraping service responded with status: ${response.status}`);
      }
      
      const scrapedEvents = await response.json();
      console.log(`📊 Scraping service returned ${scrapedEvents.length} events`);
      
      // Convert to our Event format
      return this.convertScrapedEvents(scrapedEvents);
      
    } catch (error) {
      console.error('Error fetching from scraping service:', error);
      throw error;
    }
  }

  // Browser scraping fallback
  private static async browserScrape(): Promise<Omit<Event, 'id' | 'scrapedAt'>[]> {
    const allEvents: Omit<Event, 'id' | 'scrapedAt'>[] = [];
    
    for (const [category, venues] of Object.entries(EventScraper.websites)) {
      for (const venue of venues) {
        try {
          console.log(`🌐 Browser scraping ${venue.venue} (${venue.url})...`);
          const events = await EventScraper.scrapeWebsite(venue.url, venue.venue, venue.category);
          allEvents.push(...events);
        } catch (error) {
          console.error(`Error scraping ${venue.venue}:`, error);
          // Add fallback events when scraping fails
          allEvents.push(...this.getFallbackEvents(venue.venue, venue.category));
        }
      }
    }
    
    console.log(`🌐 Browser scraping completed: ${allEvents.length} events found`);
    return allEvents;
  }

  // Method to add website sources
  static addWebsiteSource(category: string, venue: string, url: string) {
    if (!EventScraper.websites[category]) {
      EventScraper.websites[category] = [];
    }
    EventScraper.websites[category].push({ url, category, venue });
  }

  // Browser-compatible web scraping implementation
  private static async scrapeWebsite(url: string, venue: string, category: string): Promise<Omit<Event, 'id' | 'scrapedAt'>[]> {
    try {
      // Use the Fetch API to get the webpage content
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      return EventScraper.parseEventDetails(html, venue, category);
      
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      
      // Return fallback events when scraping fails
      return EventScraper.getFallbackEvents(venue, category);
    }
  }

  // Parse event details from scraped HTML content
  private static parseEventDetails(html: string, venue: string, category: string): Omit<Event, 'id' | 'scrapedAt'>[] {
    const events: Omit<Event, 'id' | 'scrapedAt'>[] = [];
    
    try {
      // Create a DOM parser to extract information
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Look for common event patterns in the HTML
      const eventElements = doc.querySelectorAll('[class*="event"], [class*="Event"], [id*="event"], [id*="Event"], [class*="show"], [class*="program"]');
      
      eventElements.forEach((element, index) => {
        const title = EventScraper.extractText(element, 'h1, h2, h3, h4, .title, .event-title');
        const date = EventScraper.extractText(element, '.date, .event-date, time, [datetime]');
        const time = EventScraper.extractText(element, '.time, .event-time');
        const location = EventScraper.extractText(element, '.location, .venue, .address, .branch');
        const cost = EventScraper.extractText(element, '.price, .cost, .ticket-price');
        const description = EventScraper.extractText(element, '.description, .event-description, p, .desc');
        const eventUrl = EventScraper.extractUrl(element, 'a[href]');
        
        if (title && title.length > 3) {
          events.push({
            title: title.trim(),
            date: EventScraper.normalizeDate(date),
            time: time?.trim(),
            location: location?.trim() || venue,
            cost: cost?.trim() || 'TBD',
            url: eventUrl,
            source: venue,
            venue: venue,
            category: category,
            description: description?.trim()
          });
        }
      });
      
      // If no events found with standard selectors, try alternative approaches
      if (events.length === 0) {
        events.push(...EventScraper.getFallbackEvents(venue, category));
      }
      
    } catch (error) {
      console.error('Error parsing HTML:', error);
      // Return fallback events if parsing fails
      events.push(...EventScraper.getFallbackEvents(venue, category));
    }
    
    return events;
  }

  // Extract text content from DOM elements
  private static extractText(element: Element, selector: string): string | null {
    const found = element.querySelector(selector);
    return found ? found.textContent : null;
  }

  // Extract URL from DOM elements
  private static extractUrl(element: Element, selector: string): string | null {
    const found = element.querySelector(selector) as HTMLAnchorElement;
    return found ? found.href : null;
  }

  // Fallback events when scraping fails (for demonstration)
  private static getFallbackEvents(venue: string, category: string): Omit<Event, 'id' | 'scrapedAt'>[] {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return [
      {
        title: `${venue} Event`,
        date: today.toISOString().split('T')[0],
        time: '7:00 PM',
        location: venue,
        cost: '$25',
        url: '#',
        source: venue,
        venue: venue,
        category: category,
        description: `Sample event at ${venue} - start the scraping service for real data`
      }
    ];
  }

  // Convert your existing scraper output format to our Event format
  static convertScrapedEvents(scrapedEvents: ScrapedEvent[]): Omit<Event, 'id' | 'scrapedAt'>[] {
    return scrapedEvents.map(scraped => ({
      title: scraped.title,
      date: scraped.date_start ? EventScraper.normalizeDate(scraped.date_start) : new Date().toISOString().split('T')[0],
      time: undefined, // Extract from date_start if needed
      location: scraped.location || scraped.source,
      cost: scraped.price || 'TBD',
      url: scraped.source_url || '#',
      source: scraped.source,
      venue: scraped.source,
      category: EventScraper.mapCategory(scraped.category),
      description: scraped.description
    }));
  }

  // Map your existing categories to our dashboard categories
  private static mapCategory(scrapedCategory?: string): string {
    if (!scrapedCategory) return 'other';
    
    const categoryMap: { [key: string]: string } = {
      'Comedy': 'comedy',
      'Education': 'education',
      'Music': 'music',
      'Sports': 'sports',
      'Food': 'food',
      'Tech': 'tech',
      'Cycling': 'sports',
      'Film': 'entertainment',
      'Creative': 'education'
    };
    
    return categoryMap[scrapedCategory] || 'other';
  }

  // Utility method to normalize dates
  private static normalizeDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Try to parse common date formats
        const formats = [
          /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
          /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
          /(\w+)\s+(\d{1,2}),?\s+(\d{4})/   // Month DD, YYYY
        ];
        
        for (const format of formats) {
          const match = dateString.match(format);
          if (match) {
            if (format.source.includes('YYYY')) {
              const [_, month, day, year] = match;
              return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
          }
        }
        
        // If all else fails, return today's date
        return new Date().toISOString().split('T')[0];
      }
      
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error normalizing date:', dateString, error);
      return new Date().toISOString().split('T')[0];
    }
  }

  // Utility method to extract cost information
  private static extractCost(text: string): string | undefined {
    const costPatterns = [
      /\$\d+(?:\.\d{2})?/g,
      /free/gi,
      /donation/gi,
      /\d+\s*dollars?/gi
    ];

    for (const pattern of costPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return undefined;
  }
}

export default EventScraper;