import { BaseScraper } from './base-scraper.js';
import * as cheerio from 'cheerio';

export class SFPLScraper extends BaseScraper {
  constructor() {
    super('sfpl', {
      url: 'https://sfpl.org/events',
      name: 'San Francisco Public Library'
    });
  }

  async scrapeEvents() {
    try {
      // Get browser from BaseScraper (already initialized by scrape() method)
      const page = await this.browser.newPage();
      
      console.log('🌐 Loading SFPL events page...');
      await page.goto(this.config.url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // Wait for AJAX content to load (Drupal Views)
      console.log('⏳ Waiting for AJAX content to load...');
      
      try {
        // Wait for the events view to load
        await page.waitForSelector('.view-content, .views-row, .event-item', { timeout: 10000 });
        console.log('✅ Events content loaded');
      } catch (error) {
        console.log('⚠️ Timeout waiting for events content, proceeding anyway');
      }
      
      // Wait a bit more for any additional content
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Get the HTML content
      const html = await page.content();
      await page.close();
      
      console.log(`📄 SFPL page loaded: ${html.length} characters`);
      
      const $ = cheerio.load(html);
      const events = [];

      // Look for Drupal Views event elements
      const eventSelectors = [
        '.views-row',           // Drupal Views rows
        '.view-content .views-row', // Views content rows
        '.event-item',          // Event items
        '.event',               // Event class
        '[class*="event"]',     // Any class containing "event"
        '.program',             // Program class
        '[class*="program"]',   // Any class containing "program"
        '.calendar-event',      // Calendar events
        '.library-event'        // Library events
      ];
      
      let foundEvents = false;
      
      for (const selector of eventSelectors) {
        const eventElements = $(selector);
        if (eventElements.length > 0) {
          console.log(`🔍 Found ${eventElements.length} events using selector: ${selector}`);
          foundEvents = true;
          
          eventElements.each((i, element) => {
            try {
              const $element = $(element);
              
              // Extract event details with better selectors
              const title = $element.find('h1, h2, h3, .title, [class*="title"]').first().text().trim();
              const description = $element.find('.description, .desc, [class*="description"]').first().text().trim();
              const dateText = $element.find('.date, .time, [class*="date"], .datetime').first().text().trim();
              const branch = $element.find('.branch, .location, [class*="branch"]').first().text().trim();
              const imageUrl = $element.find('img').first().attr('src');
              const eventUrl = $element.find('a').first().attr('src');

              if (title && title.length > 3) {
                // Try to parse date
                let eventDate = null;
                if (dateText) {
                  eventDate = this.parseDate(dateText);
                  if (eventDate) {
                    console.log(`✅ Parsed date: "${dateText}" -> ${eventDate}`);
                  } else {
                    console.log(`⚠️ Could not parse date: "${dateText}"`);
                  }
                }

                const event = {
                  title,
                  description: description || `Library program${branch ? ` at ${branch}` : ''}`,
                  date_start: eventDate,
                  location: branch || 'San Francisco Public Library',
                  source: 'sfpl',
                  source_url: eventUrl ? `https://sfpl.org${eventUrl}` : this.config.url,
                  category: 'Education',
                  price: 'Free',
                  image_url: imageUrl || ''
                };

                events.push(event);
              }
            } catch (error) {
              console.warn(`Error parsing SFPL event ${i}:`, error.message);
            }
          });
          
          break; // Use first working selector
        }
      }

      // Fallback to generic approach if needed
      if (events.length === 0) {
        $('h1, h2, h3, h4, h5, h6').each((i, element) => {
          const text = this.cleanText($(element).text());
          if (text && text.length > 5 && text.length < 100) {
            events.push({
              title: text,
              description: 'Library program',
              date_start: null,
              location: 'San Francisco Public Library',
              source: 'sfpl',
              source_url: this.config.url,
              category: 'Education',
              price: 'Free',
              image_url: ''
            });
          }
        });
      }

      console.log(`Found ${events.length} events from SFPL`);
      
      // Debug: Show events with dates vs without dates
      const eventsWithDates = events.filter(e => e.date_start);
      const eventsWithoutDates = events.filter(e => !e.date_start);
      console.log(`📊 Events with dates: ${eventsWithDates.length}, Events without dates: ${eventsWithoutDates.length}`);
      
      if (eventsWithoutDates.length > 0) {
        console.log('⚠️ Sample events without dates:');
        eventsWithoutDates.slice(0, 3).forEach((event, i) => {
          console.log(`  ${i + 1}. ${event.title}`);
        });
      }
      
      // Debug: Show what selectors found
      console.log('🔍 Checking what selectors found:');
      for (const selector of eventSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          console.log(`  ${selector}: ${elements.length} elements`);
          // Show first element content
          const firstElement = elements.first();
          const title = firstElement.find('h1, h2, h3, .title, [class*="title"]').first().text().trim();
          const dateText = firstElement.find('.date, .time, [class*="date"], .datetime').first().text().trim();
          console.log(`    First element - Title: "${title}", Date: "${dateText}"`);
        }
      }
      
      return events;

    } catch (error) {
      console.error('Error scraping SFPL events:', error);
      throw error;
    }
  }
  
  // Enhanced date parsing for SFPL events
  parseDate(dateText) {
    if (!dateText) return null;
    
    try {
      // Try the base scraper method first
      const baseResult = super.parseDate(dateText);
      if (baseResult) return baseResult;
      
      // Enhanced parsing for SFPL date formats
      const datePatterns = [
        // "August 21, 2025" format
        /(\w+)\s+(\d{1,2}),?\s+(\d{4})/i,
        // "Aug 21, 2025" format  
        /(\w{3,})\s+(\d{1,2}),?\s+(\d{4})/i,
        // "8/21/25" format
        /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,
        // "8-21-25" format
        /(\d{1,2})-(\d{1,2})-(\d{2,4})/,
        // "Today", "Tomorrow", "Tonight"
        /(today|tomorrow|tonight)/i
      ];
      
      for (const pattern of datePatterns) {
        const match = dateText.match(pattern);
        if (match) {
          if (match[1] && match[2] && match[3]) {
            // Full date format
            const month = match[1];
            const day = parseInt(match[2]);
            const year = parseInt(match[3]);
            
            // Handle 2-digit years
            const fullYear = year < 100 ? 2000 + year : year;
            
            // Convert month name to number
            const monthNames = ['january', 'jan', 'february', 'feb', 'march', 'mar', 'april', 'apr', 'may', 'june', 'jun', 'july', 'jul', 'august', 'aug', 'september', 'sep', 'october', 'oct', 'november', 'nov', 'december', 'dec'];
            const monthIndex = monthNames.findIndex(name => month.toLowerCase().startsWith(name));
            
            if (monthIndex !== -1) {
              const actualMonthIndex = Math.floor(monthIndex / 2);
              const date = new Date(fullYear, actualMonthIndex, day);
              return date.toISOString();
            }
          } else if (match[1] && match[1].toLowerCase() === 'today') {
            // Today
            const today = new Date();
            return today.toISOString();
          } else if (match[1] && match[1].toLowerCase() === 'tomorrow') {
            // Tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.toISOString();
          } else if (match[1] && match[1].toLowerCase() === 'tonight') {
            // Tonight
            const tonight = new Date();
            return tonight.toISOString();
          }
        }
      }
      
      return null;
    } catch (error) {
      console.warn(`Error parsing date: ${dateText}`, error.message);
      return null;
    }
  }
}
