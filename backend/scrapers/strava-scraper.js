import { BaseScraper } from './base-scraper.js';
import * as cheerio from 'cheerio';

export class StravaScraper extends BaseScraper {
  constructor() {
    super('strava', {
      url: 'https://www.strava.com/clubs',
      name: 'Strava Groups'
    });
  }

  async scrapeEvents() {
    try {
      const html = await this.getPageContent(this.config.url);
      const $ = cheerio.load(html);
      const events = [];

      // Look for group/event elements
      $('.club-item, .group-item, [class*="club"], [class*="group"]').each((i, element) => {
        try {
          const title = this.cleanText(this.extractText(element, 'h1, h2, h3, .title, [class*="title"]'));
          const description = this.cleanText(this.extractText(element, '.description, .desc, [class*="description"]'));
          const memberCount = this.cleanText(this.extractText(element, '.members, .count, [class*="member"]'));
          const imageUrl = this.extractAttribute(element, 'img', 'src');
          const groupUrl = this.extractAttribute(element, 'a', 'href');

          if (title) {
            const event = {
              title,
              description: description || `Strava group${memberCount ? ` - ${memberCount} members` : ''}`,
              date_start: null, // Strava groups are ongoing, not time-specific
              location: 'Bay Area',
              source: 'strava',
              source_url: groupUrl ? `https://www.strava.com${groupUrl}` : this.config.url,
              category: 'Fitness',
              price: 'Free',
              image_url: imageUrl
            };

            events.push(event);
          }
        } catch (error) {
          console.warn(`Error parsing Strava group ${i}:`, error.message);
        }
      });

      // Fallback to generic approach if needed
      if (events.length === 0) {
        $('h1, h2, h3, h4, h5, h6').each((i, element) => {
          const text = this.cleanText($(element).text());
          if (text && text.length > 5 && text.length < 100 && 
              (text.toLowerCase().includes('club') || text.toLowerCase().includes('group'))) {
            events.push({
              title: text,
              description: 'Strava fitness group',
              date_start: null,
              location: 'Bay Area',
              source: 'strava',
              source_url: this.config.url,
              category: 'Fitness',
              price: 'Free',
              image_url: ''
            });
          }
        });
      }

      console.log(`Found ${events.length} groups from Strava`);
      return events;

    } catch (error) {
      console.error('Error scraping Strava groups:', error);
      throw error;
    }
  }
}
