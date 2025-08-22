import { BaseScraper } from './base-scraper.js';
import * as cheerio from 'cheerio';

export class greenapple extends BaseScraper {
  constructor() {
    super('greenapple', {
      url: 'https://greenapplebooks.com/events',
      name: 'Green Apple Books'
    });
  }

  async scrapeEvents() {
    try {
      console.log('📚 Scraping Green Apple Books events...');
      const html = await this.getPageContent(this.config.url);
      if (!html) return [];
      const $ = cheerio.load(html);
      const events = [];

      const eventContainers = $('.event-list__details');
      console.log(`🔍 Found ${eventContainers.length} .event-list__details containers`);
      
      eventContainers.each((i, element) => {
        try {
          const $element = $(element);
          
          // Title and link
          const $titleElement = $element.find('h3.event-list__title a');
          if (!$titleElement.length) return;
          const title = $titleElement.text().trim();
          if (!title) return;
          let href = $titleElement.attr('href') || this.config.url;
          if (href && href.startsWith('/')) href = `https://greenapplebooks.com${href}`;

          // Helper to extract value text from a details item by label
          const extractDetail = (labelPrefix) => {
            const $item = $element.find('.event-list__details--item').filter((_, el) => {
              return $(el).find('.event-list__details--label').text().trim().toLowerCase().startsWith(labelPrefix.toLowerCase());
            }).first();
            if (!$item.length) return '';
            // Clone and remove the label to get the value text
            const $clone = $item.clone();
            $clone.find('.event-list__details--label').remove();
            return $clone.text().trim();
          };

          const dateText = extractDetail('Date');
          const timeText = extractDetail('Time');
          const locationValue = extractDetail('Location') || extractDetail('Store') || this.config.name;

          if (!dateText) return;

          // Parse date/time
          const eventDateISO = this.parseGreenAppleDateTime(dateText, timeText);
          if (!eventDateISO) return;

          // Description
          const description = $element.find('.event-list__body').text().trim();

          const event = {
            title: title,
            description: description || `${title} at ${this.config.name}`,
            date_start: eventDateISO,
            location: locationValue || this.config.name,
            source: this.config.name,
            source_url: href,
            category: 'Books & Literature',
            price: 'Free',
            host: this.config.name,
            image_url: '',
            time_text: timeText || 'Time varies'
          };

          if (this.validateEventData(event)) {
            events.push(event);
            console.log(`📚 Found Green Apple event: ${title} on ${eventDateISO}`);
          }
        } catch (error) {
          console.warn(`⚠️ Error processing Green Apple event:`, error.message);
        }
      });

      console.log(`✅ Green Apple Books scraper found ${events.length} events.`);
      return events;
    } catch (error) {
      console.error('Error scraping Green Apple Books events:', error);
      throw error;
    }
  }

  // Parse formats like "Wed, 8/13/2025", "8/13/2025", or "Wed, Aug 13, 2025" with optional time like "7:00 PM"
  parseGreenAppleDateTime(dateText, timeText) {
    try {
      const trimmedDate = (dateText || '').replace(/^[A-Za-z]{3,},\s*/,'').trim();
      let year, month, day;

      // Numeric M/D/YYYY
      let m = trimmedDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (m) {
        month = parseInt(m[1], 10) - 1;
        day = parseInt(m[2], 10);
        year = parseInt(m[3], 10);
      } else {
        // Month name D, YYYY
        const monthMap = {
          jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,sept:8,oct:9,nov:10,dec:11
        };
        m = trimmedDate.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i);
        if (!m) return null;
        month = monthMap[m[1].toLowerCase()];
        day = parseInt(m[2], 10);
        year = parseInt(m[3], 10);
      }

      const eventDate = new Date(year, month, day);

      // Apply time if present
      if (timeText) {
        const t = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (t) {
          let hours = parseInt(t[1], 10);
          const minutes = parseInt(t[2], 10);
          const period = t[3].toUpperCase();
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          eventDate.setHours(hours, minutes, 0, 0);
        }
      }

      // Only future events
      const now = new Date();
      if (eventDate <= now) return null;

      return eventDate.toISOString();
    } catch (error) {
      console.warn(`⚠️ Error parsing Green Apple date/time "${dateText} ${timeText || ''}":`, error.message);
      return null;
    }
  }
}
