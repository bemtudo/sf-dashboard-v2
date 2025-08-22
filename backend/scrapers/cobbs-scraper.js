import { BaseScraper } from './base-scraper.js';
import * as cheerio from 'cheerio';

export class CobbsScraper extends BaseScraper {
  constructor() {
    super('cobbs', {
      url: 'https://www.cobbscomedy.com/shows',
      name: 'Cobb\'s Comedy Club'
    });
  }

  async scrapeEvents() {
    try {
      console.log('🎭 Scraping Cobb\'s Comedy Club events...');
      const html = await this.getPageContent(this.config.url);
      const $ = cheerio.load(html);
      const events = [];

      // Look for JSON-LD structured data with real events
      $('script[type="application/ld+json"]').each((i, element) => {
        try {
          const scriptContent = $(element).html();
          if (!scriptContent) return;

          const eventData = JSON.parse(scriptContent);
          
          // Check if this is a MusicEvent (comedy shows are classified as MusicEvent)
          if (eventData['@type'] === 'MusicEvent' && eventData.name && eventData.startDate) {
            const eventDate = new Date(eventData.startDate);
            const now = new Date();
            
            // Only include future events
            if (eventDate > now) {
              const event = {
                title: eventData.name,
                description: `${eventData.name} - Comedy Show at Cobb's Comedy Club`,
                date_start: eventDate.toISOString(),
                location: 'Cobb\'s Comedy Club, 915 Columbus Avenue, San Francisco, CA',
                source: this.config.name,
                source_url: eventData.url || this.config.url,
                category: 'Comedy',
                price: 'Varies',
                host: 'Cobb\'s Comedy Club',
                image_url: eventData.image || '',
                time_text: eventDate.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })
              };
              
              events.push(event);
              console.log(`🎭 Found Cobb's event: ${eventData.name} on ${eventDate.toISOString()}`);
            }
          }
        } catch (error) {
          console.warn(`⚠️ Error parsing Cobb's JSON-LD event ${i}:`, error.message);
        }
      });

      console.log(`✅ Cobb's Comedy Club scraper found ${events.length} events`);
      return events;
    } catch (error) {
      console.error('Error scraping Cobb\'s events:', error);
      throw error;
    }
  }
}
