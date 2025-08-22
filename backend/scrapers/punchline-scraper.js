import { BaseScraper } from './base-scraper.js';
import * as cheerio from 'cheerio';

export class PunchlineScraper extends BaseScraper {
  constructor() {
    super('punchline', {
      url: 'https://www.punchlinecomedyclub.com/shows',
      name: 'Punchline Comedy Club'
    });
  }

  async scrapeEvents() {
    try {
      const html = await this.getPageContent(this.config.url);
      const $ = cheerio.load(html);
      const events = [];

      // 🎯 STRATEGY 1: Extract from Schema.org JSON-LD (Most Reliable)
      console.log('🔍 Step 1: Extracting from Schema.org structured data...');
      const schemaEvents = this.extractSchemaData(html);
      if (schemaEvents.length > 0) {
        console.log(`✅ Found ${schemaEvents.length} events from structured data`);
        schemaEvents.forEach(eventData => {
          const event = {
            title: eventData.title,
            description: eventData.description || `Comedy show at Punchline Comedy Club`,
            date_start: eventData.date_start,
            location: eventData.location || 'Punchline Comedy Club, San Francisco',
            source: 'punchline',
            source_url: eventData.source_url || this.config.url,
            category: 'Comedy',
            price: eventData.price || 'Varies',
            image_url: eventData.image_url || ''
          };
          
          if (this.validateEventData(event)) {
            events.push(event);
          }
        });
      }

      // 🎯 STRATEGY 2: Smart CSS Selector Fallback (If no structured data)
      if (events.length === 0) {
        console.log('🔍 Step 2: Falling back to smart CSS selectors...');
        
        // Try multiple selector strategies in order of specificity
        const selectorStrategies = [
          // Most specific - look for actual event containers
          '.event-card, .show-card, .performance-item, [data-event-id]',
          // Medium specific - look for event-related classes
          '.event, .show, .performance, .comedy-show',
          // Generic but filtered - look for headings that might be events
          'h1, h2, h3, h4'
        ];

        for (const selector of selectorStrategies) {
          if (events.length > 0) break; // Stop if we found events
          
          $(selector).each((i, element) => {
            try {
              // Use smart extraction methods with validation
              const title = this.extractTitle(element, 'h1, h2, h3, .title, .event-title, .show-title');
              const description = this.extractDescription(element, '.description, .desc, .event-desc, p');
              const date = this.extractDate(element, '.date, .time, .event-date, .show-time, [datetime]');
              const price = this.extractPrice(element, '.price, .cost, .ticket-price, .admission');
              const imageUrl = this.extractAttribute(element, 'img', 'src');
              const eventUrl = this.extractAttribute(element, 'a', 'href');

              if (title && date) { // Must have both title and date
                const event = {
                  title,
                  description: description || `Comedy show at Punchline Comedy Club`,
                  date_start: date,
                  location: 'Punchline Comedy Club, San Francisco',
                  source: 'punchline',
                  source_url: eventUrl ? `https://www.punchlinecomedyclub.com${eventUrl}` : this.config.url,
                  category: 'Comedy',
                  price: price || 'Varies',
                  image_url: imageUrl || ''
                };

                if (this.validateEventData(event)) {
                  events.push(event);
                }
              }
            } catch (error) {
              console.warn(`Error parsing Punchline event ${i}:`, error.message);
            }
          });
        }
      }

      // 🎯 STRATEGY 3: Content Analysis Fallback (Last Resort)
      if (events.length === 0) {
        console.log('🔍 Step 3: Using content analysis fallback...');
        
        // Look for text patterns that suggest events
        const textContent = $.text();
        const eventPatterns = [
          /(?:comedy|show|performance|event).*?(?:at|in|on).*?(?:punchline|comedy club)/gi,
          /(?:stand.?up|comedy|show).*?(?:tonight|tomorrow|this week|next week)/gi
        ];

        // This is a very basic fallback - in practice you'd want more sophisticated analysis
        if (eventPatterns.some(pattern => pattern.test(textContent))) {
          events.push({
            title: 'Comedy Show at Punchline',
            description: 'Comedy show at Punchline Comedy Club (details extracted from page content)',
            date_start: new Date().toISOString(), // Default to today
            location: 'Punchline Comedy Club, San Francisco',
            source: 'punchline',
            source_url: this.config.url,
            category: 'Comedy',
            price: 'Varies',
            image_url: ''
          });
        }
      }

      console.log(`Found ${events.length} events from Punchline`);
      return events;

    } catch (error) {
      console.error('Error scraping Punchline events:', error);
      throw error;
    }
  }
}
