import { BaseScraper } from './base-scraper.js';
import * as cheerio from 'cheerio';

export class CafeDuNordScraper extends BaseScraper {
  constructor() {
    super('cafedunord', {
      url: 'https://cafedunord.com/',
      name: 'Cafe Du Nord'
    });
  }

  async scrapeEvents() {
    try {
      console.log('🍷 Scraping Cafe Du Nord events...');
      const html = await this.getPageContent(this.config.url);
      const $ = cheerio.load(html);
      const events = [];

      // Look for actual events using the tw-event structure
      $('.tw-section').each((i, element) => {
        try {
          const $element = $(element);
          
          // Extract event title from .tw-name a span
          const $titleElement = $element.find('.tw-name a span');
          if (!$titleElement.length) return;
          
          let title = this.cleanText($titleElement.text().trim());
          if (!title || title.length < 3) return;
          
          // Extract date from .tw-event-date and .tw-day-of-week
          const $dateElement = $element.find('.tw-event-date');
          const $dayElement = $element.find('.tw-day-of-week');
          
          if (!$dateElement.length || !$dayElement.length) return;
          
          const dateText = $dateElement.text().trim();
          const dayText = $dayElement.text().trim();
          
          // Parse the date (format: "8.21" + "Thu")
          const eventDate = this.parseCafeDuNordDate(dateText, dayText);
          if (!eventDate) return;
          
          // Extract time from .tw-event-time
          let eventTime = '';
          const $timeElement = $element.find('.tw-event-time');
          if ($timeElement.length) {
            eventTime = this.cleanText($timeElement.text().trim());
          }
          
          // Extract attractions/supporting acts
          let attractions = '';
          const $attractionsElement = $element.find('.tw-attractions span');
          if ($attractionsElement.length) {
            attractions = this.cleanText($attractionsElement.text().trim());
          }
          
          // Extract venue
          let venue = 'Cafe Du Nord';
          const $venueElement = $element.find('.tw-venue-name');
          if ($venueElement.length) {
            venue = this.cleanText($venueElement.text().trim());
          }
          
          // Extract image URL
          const $imageElement = $element.find('.tw-image img');
          const imageUrl = $imageElement.attr('src') || '';
          
          // Extract event URL
          let eventUrl = '';
          const $linkElement = $element.find('.tw-name a');
          if ($linkElement.length) {
            eventUrl = $linkElement.attr('href') || '';
          }
          
          // Create event object
          const event = {
            title: title,
            description: attractions ? `${title} with ${attractions}` : `${title} - Live music at ${venue}`,
            date_start: eventDate,
            location: venue,
            source: 'cafedunord',
            source_url: eventUrl || this.config.url,
            category: 'Music',
            price: 'Varies',
            host: 'Cafe Du Nord',
            image_url: imageUrl,
            time_text: eventTime || 'Show time TBD'
          };

          events.push(event);
          console.log(`🎯 Found Cafe Du Nord event: ${title} on ${eventDate} at ${eventTime || 'TBD'}`);
          
        } catch (error) {
          console.warn(`⚠️ Error parsing Cafe Du Nord event ${i}:`, error.message);
        }
      });

      console.log(`✅ Cafe Du Nord scraper found ${events.length} events`);
      return events;

    } catch (error) {
      console.error('❌ Error scraping Cafe Du Nord events:', error);
      throw error;
    }
  }

  // Parse Cafe Du Nord specific date format: "8.21" + "Thu"
  parseCafeDuNordDate(dateText, dayText) {
    if (!dateText || !dayText) return null;
    
    try {
      // Extract month and day from "8.21" format
      const dateMatch = dateText.match(/(\d+)\.(\d+)/);
      if (!dateMatch) return null;
      
      const month = parseInt(dateMatch[1]) - 1; // Month is 0-indexed
      const day = parseInt(dateMatch[2]);
      
      // Get current year
      const currentYear = new Date().getFullYear();
      
      // Create date object
      const eventDate = new Date(currentYear, month, day);
      
      // Validate the date
      if (isNaN(eventDate.getTime())) return null;
      
      // If the date is in the past, try next year
      const now = new Date();
      if (eventDate < now) {
        eventDate.setFullYear(currentYear + 1);
      }
      
      return eventDate.toISOString();
      
    } catch (error) {
      console.warn(`⚠️ Could not parse Cafe Du Nord date: ${dateText} ${dayText}`, error.message);
      return null;
    }
  }
}
