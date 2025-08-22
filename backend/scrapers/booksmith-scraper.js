import { BaseScraper } from './base-scraper.js';
import * as cheerio from 'cheerio';

export class BooksmithScraper extends BaseScraper {
  constructor() {
    super('booksmith', {
      url: 'https://www.booksmith.com/events',
      name: 'Booksmith'
    });
    // Fixed: Use the correct Booksmith URL
    this.config.url = 'https://www.booksmith.com/events';
    console.log('📚 Booksmith scraper using correct Booksmith URL:', this.config.url);
  }

  async scrapeEvents() {
    try {
      console.log('📚 Scraping Booksmith events...');
      const html = await this.getPageContent(this.config.url);
      const $ = cheerio.load(html);
      const events = [];

      // Look for event elements - Booksmith likely uses a standard events structure
      // Common selectors for events: .event, .event-item, .calendar-event, etc.
      $('.event, .event-item, .calendar-event, .event-card, article, .post, .event-listing').each((i, element) => {
        try {
          const $element = $(element);
          
          // Extract event title from various possible selectors
          let title = '';
          const titleSelectors = ['.event-title', '.title', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', '.event-name', '.book-title'];
          for (const selector of titleSelectors) {
            const titleElement = $element.find(selector).first();
            if (titleElement.length > 0) {
              title = this.cleanText(titleElement.text().trim());
              break;
            }
          }
          
          // Skip if no title found
          if (!title || title.length < 5 || title.length > 200) return;
          
          // Extract date from various possible selectors
          let eventDate = null;
          const dateSelectors = ['.event-date', '.date', '.event-time', 'time', '.datetime', '.event-datetime'];
          for (const selector of dateSelectors) {
            const dateElement = $element.find(selector).first();
            if (dateElement.length > 0) {
              const dateText = dateElement.text().trim();
              eventDate = this.parseDate(dateText);
              if (eventDate) break;
            }
          }
          
          // Look for date in datetime attribute
          if (!eventDate) {
            const dateTimeAttr = $element.find('time').attr('datetime') || $element.attr('data-date');
            if (dateTimeAttr) {
              eventDate = this.parseDateTime(dateTimeAttr);
            }
          }
          
          // Extract description
          let description = '';
          const descSelectors = ['.event-description', '.description', '.excerpt', '.summary', 'p', '.event-details'];
          for (const selector of descSelectors) {
            const descElement = $element.find(selector).first();
            if (descElement.length > 0) {
              description = this.cleanText(descElement.text().trim());
              if (description.length > 10) break;
            }
          }
          
          // Extract time
          let eventTime = '';
          const timeSelectors = ['.event-time', '.time', '.start-time', '.event-datetime'];
          for (const selector of timeSelectors) {
            const timeElement = $element.find(selector).first();
            if (timeElement.length > 0) {
              const timeText = timeElement.text().trim();
              if (timeText.includes('AM') || timeText.includes('PM')) {
                eventTime = timeText;
                break;
              }
            }
          }
          
          // Extract image URL
          const imageUrl = $element.find('img').first().attr('src') || '';
          
          // Extract event URL
          let eventUrl = '';
          const linkElement = $element.find('a').first();
          if (linkElement.length > 0) {
            eventUrl = linkElement.attr('href') || '';
            if (eventUrl && !eventUrl.startsWith('http')) {
              eventUrl = `https://www.booksmith.com${eventUrl}`;
            }
          }
          
          // Create event object
          const event = {
            title: title,
            description: description || `${title} - Booksmith event`,
            date_start: eventDate,
            location: 'Booksmith, San Francisco',
            source: 'booksmith',
            source_url: eventUrl || this.config.url,
            category: 'Books & Literature',
            price: 'Free',
            host: 'Booksmith',
            image_url: imageUrl.startsWith('http') ? imageUrl : `https://www.booksmith.com${imageUrl}`,
            time_text: eventTime
          };

          // Only add events with valid titles and dates
          if (event.title && event.title !== 'undefined' && event.title.length > 5 && event.date_start) {
            events.push(event);
            console.log(`🎯 Found Booksmith event: ${event.title} on ${event.date_start} at ${event.time_text || 'TBD'}`);
          }
        } catch (error) {
          console.warn(`⚠️ Error parsing Booksmith event ${i}:`, error.message);
        }
      });

      // Alternative approach: look for any text that looks like an event
      if (events.length === 0) {
        console.log('🔍 No events found with main selectors, trying alternative approach...');
        
        $('h1, h2, h3, h4, h5, h6, p, div').each((i, element) => {
          const text = this.cleanText($(element).text());
          if (text && text.length > 15 && text.length < 150 && 
              !text.includes('Booksmith') && !text.includes('Books') &&
              !text.includes('Events') && !text.includes('About') &&
              (text.includes('PM') || text.includes('AM') || text.includes('2025'))) {
            
            const event = {
              title: text.split(' - ')[0].trim(),
              description: `${text.split(' - ')[0].trim()} - Booksmith event`,
              date_start: null, // Will need to parse from text
              location: 'Booksmith, San Francisco',
              source: 'booksmith',
              source_url: this.config.url,
              category: 'Books & Literature',
              price: 'Free',
              host: 'Booksmith',
              image_url: '',
              time_text: text.includes('PM') || text.includes('AM') ? 'TBD' : ''
            };
            
            events.push(event);
            console.log(`🎯 Found alternative Booksmith event: ${event.title}`);
          }
        });
      }

      console.log(`✅ Booksmith scraper found ${events.length} events`);
      return events;

    } catch (error) {
      console.error('❌ Error scraping Booksmith events:', error);
      throw error;
    }
  }

  // Parse various date formats
  parseDate(dateString) {
    if (!dateString) return null;
    
    try {
      // Try common date formats
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      
      // Try parsing specific formats
      const formats = [
        /(\w+)\s+(\d{1,2}),?\s+(\d{4})/i, // "August 19, 2025"
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/i, // "8/19/2025"
        /(\d{1,2})-(\d{1,2})-(\d{4})/i,   // "8-19-2025"
      ];
      
      for (const format of formats) {
        const match = dateString.match(format);
        if (match) {
          const date = new Date(match[2], match[1] - 1, match[3]);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        }
      }
      
      return null;
    } catch (error) {
      console.warn(`⚠️ Could not parse date: ${dateString}`, error.message);
      return null;
    }
  }

  parseDateTime(dateTimeString) {
    if (!dateTimeString) return null;
    
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString();
    } catch (error) {
      console.warn(`⚠️ Could not parse datetime: ${dateTimeString}`, error.message);
      return null;
    }
  }
}
