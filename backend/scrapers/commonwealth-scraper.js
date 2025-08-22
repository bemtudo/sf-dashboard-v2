import { BaseScraper } from './base-scraper.js';
import * as cheerio from 'cheerio';

export class CommonwealthScraper extends BaseScraper {
  constructor() {
    super('commonwealth', {
      url: 'https://www.commonwealthclub.org/events',
      name: 'Commonwealth Club'
    });
  }

  async scrapeEvents() {
    try {
      console.log('🏛️ Scraping Commonwealth Club events...');
      const html = await this.getPageContent(this.config.url);
      const $ = cheerio.load(html);
      const events = [];

      // Look for real events in the Drupal Views structure
      $('.node--type-event').each((i, element) => {
        try {
          const $element = $(element);
          
          // Extract event title from the node title field
          const $titleElement = $element.find('.field--name-node-title h3 a');
          if (!$titleElement.length) return;
          
          const title = $titleElement.text().trim();
          if (!title || title.length < 5) return;
          
          // Extract date from the event date field
          const $dateElement = $element.find('.field--name-field-event-date');
          if (!$dateElement.length) return;
          
          const dateText = $dateElement.text().trim();
          if (!dateText) return;
          
          // Parse the date (format: "Wed, Aug 27 / 5:30 PM PDT")
          const eventDate = this.parseCommonwealthDate(dateText);
          if (!eventDate) return;
          
          // Only include future events
          const now = new Date();
          if (eventDate <= now) return;
          
          // Extract event URL
          const eventUrl = $titleElement.attr('href');
          const fullEventUrl = eventUrl ? `https://www.commonwealthclub.org${eventUrl}` : this.config.url;
          
          // Extract region/location
          const region = $element.find('.field--name-field-region .field__item').text().trim() || 'San Francisco';
          
          // Extract image
          const $imageElement = $element.find('.field--name-field-hero-image img');
          const imageUrl = $imageElement.attr('src') || '';
          
          const event = {
            title: title,
            description: `${title} - Talk at Commonwealth Club`,
            date_start: eventDate.toISOString(),
            location: `Commonwealth Club, ${region}`,
            source: this.config.name,
            source_url: fullEventUrl,
            category: 'Talks',
            price: 'Varies',
            host: 'Commonwealth Club',
            image_url: imageUrl,
            time_text: dateText
          };
          
          events.push(event);
          console.log(`🏛️ Found Commonwealth event: ${title} on ${eventDate.toISOString()}`);
        } catch (error) {
          console.warn(`⚠️ Error processing Commonwealth event ${i}:`, error.message);
        }
      });

      console.log(`✅ Commonwealth Club scraper found ${events.length} events`);
      return events;
    } catch (error) {
      console.error('Error scraping Commonwealth events:', error);
      throw error;
    }
  }

  parseCommonwealthDate(dateText) {
    try {
      // Format: "Wed, Aug 27 / 5:30 PM PDT"
      const match = dateText.match(/(\w{3}),\s+(\w{3})\s+(\d{1,2})\s*\/\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*(\w+)/i);
      if (!match) return null;
      
      const [, dayOfWeek, month, day, hour, minute, ampm, timezone] = match;
      
      const monthMap = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
      };
      
      const monthIndex = monthMap[month.toLowerCase()];
      if (monthIndex === undefined) return null;
      
      let hour24 = parseInt(hour);
      if (ampm.toLowerCase() === 'pm' && hour24 !== 12) hour24 += 12;
      if (ampm.toLowerCase() === 'am' && hour24 === 12) hour24 = 0;
      
      // Assume current year for now
      const currentYear = new Date().getFullYear();
      const eventDate = new Date(currentYear, monthIndex, parseInt(day), hour24, parseInt(minute));
      
      // If the date is in the past, it might be next year
      if (eventDate < new Date()) {
        eventDate.setFullYear(currentYear + 1);
      }
      
      return eventDate;
    } catch (error) {
      console.warn(`⚠️ Error parsing Commonwealth date "${dateText}":`, error.message);
      return null;
    }
  }
}
