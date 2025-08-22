import { BaseScraper } from './base-scraper.js';
import * as cheerio from 'cheerio';

export class ChapelScraper extends BaseScraper {
  constructor() {
    super('chapel', {
      url: 'https://thechapelsf.com/calendar/',
      name: 'The Chapel SF',
      category: 'Music',
      location: 'The Chapel, San Francisco',
      host: 'The Chapel SF'
    });
  }

  async scrapeEvents() {
    try {
      console.log('🎵 Scraping The Chapel events...');
      
      // Navigate to the page
      const page = await this.browser.newPage();
      await page.goto(this.config.url, { waitUntil: 'domcontentloaded' });
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Get the HTML content
      const html = await page.content();
      await page.close();
      
      console.log(`📄 Chapel page loaded: ${html.length} characters`);
      
      const $ = cheerio.load(html);
      const events = [];
      const seenEvents = new Set();

      // Look for calendar events - The Chapel uses a calendar format
      $('.seetickets-calendar-event-container').each((i, element) => {
        try {
          const $element = $(element);
          
          // Extract title
          const $titleElement = $element.find('.title.seetickets-calendar-event-title a');
          if (!$titleElement.length) return;
          
          let title = $titleElement.text().trim();
          if (!title || title.length < 3) return;
          
          // Clean up the title
          title = title.replace(/^\d+/, '').trim();
          title = title.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}/i, '').trim();
          title = title.replace(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}/i, '').trim();
          
          if (!title || title.length < 3) return;
          
          // Skip duplicates
          const titleKey = title.toLowerCase();
          if (seenEvents.has(titleKey)) return;
          seenEvents.add(titleKey);
          
          // Find the parent table cell to get the date
          const $parentTd = $element.closest('td');
          if (!$parentTd.length) return;
          
          // Find the date number in this cell
          const $dateNumber = $parentTd.find('.fs-16.date-number');
          if (!$dateNumber.length) return;
          
          const dateNumber = $dateNumber.text().trim();
          if (!dateNumber) return;
          
          // Find the month context from the header preceding the table
          const $table = $parentTd.closest('table');
          if (!$table.length) return;
          
          const $monthHeader = $table.prev('.seetickets-calendar-year-month-container');
          if (!$monthHeader.length) return;
          
          const monthText = $monthHeader.find('.bold').text().trim();
          if (!monthText) return;
          
          // Parse month and day
          const monthMap = {
            'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
            'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
          };
          const month = monthMap[monthText.toLowerCase()];
          const day = parseInt(dateNumber, 10);
          if (month === undefined || !day) return;
          
          // Determine correct year (handle year transitions)
          const now = new Date();
          const currentYear = now.getFullYear();
          let year = currentYear;
          const currentMonth = now.getMonth();
          if (month < currentMonth - 1) {
            // If calendar shows a much earlier month relative to now, assume next year
            year = currentYear + 1;
          }
          
          // Create event date (default time set later)
          const eventDate = new Date(year, month, day);
          
          // Extract time from the doortime-showtime element
          const $timeElement = $element.find('.doortime-showtime');
          let timeText = '';
          if ($timeElement.length) {
            timeText = $timeElement.text().trim();
          }
          
          // Apply time if available, else default to 8:00 PM PT
            if (timeText) {
              const timeMatch = timeText.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i);
              if (timeMatch) {
              let hours = parseInt(timeMatch[1], 10);
              const minutes = parseInt(timeMatch[2], 10);
                const period = timeMatch[3].toUpperCase();
                if (period === 'PM' && hours !== 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;
              eventDate.setHours(hours, minutes, 0, 0);
            } else {
              eventDate.setHours(20, 0, 0, 0);
            }
          } else {
            eventDate.setHours(20, 0, 0, 0);
          }
          
          const eventDateISO = eventDate.toISOString();
            
            const event = {
              title: title,
              description: `${title} - Concert at The Chapel`,
            date_start: eventDateISO,
            location: this.config.location,
            source: this.config.name,
              source_url: this.config.url,
            category: this.config.category,
              price: 'Varies',
            host: this.config.host,
              image_url: '',
            time_text: timeText || 'Show at 8:00PM'
          };
          
          // Only include valid events (BaseScraper enforces 14-day future window)
          if (this.validateEventData(event)) {
              events.push(event);
            console.log(`✅ Added Chapel event: ${title} on ${eventDateISO}`);
          }
          
        } catch (error) {
          console.error(`⚠️ Error processing Chapel event ${i}:`, error.message);
        }
      });
      
      console.log(`✅ The Chapel scraper found ${events.length} valid events`);
      return events;

    } catch (error) {
      console.error('Error scraping Chapel events:', error);
      throw error;
    }
  }
}
