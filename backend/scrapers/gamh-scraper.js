import { BaseScraper } from './base-scraper.js';

export class GAMHScraper extends BaseScraper {
  constructor() {
    super('gamh', {
      url: 'https://gamh.com/calendar/',
      name: 'Great American Music Hall'
    });
  }

  async scrapeEvents() {
    try {
      console.log('🎵 Scraping Great American Music Hall events...');
      
      // Get browser from BaseScraper (already initialized by scrape() method)
      const page = await this.browser.newPage();
      
      const url = 'https://gamh.com/calendar/';
      console.log(`🌐 Navigating to: ${url}`);
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      console.log('🌐 GAMH page loaded, waiting for events...');
      
      // Wait for the event containers to load
      try {
        await page.waitForSelector('.seetickets-list-event-container', { timeout: 15000 });
        console.log('✅ Found .seetickets-list-event-container elements');
      } catch (error) {
        console.log('❌ .seetickets-list-event-container not found, trying alternative selectors...');
        const alternativeSelectors = ['.mdc-card', '.event-info-block', '.event-title'];
        for (const selector of alternativeSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 5000 });
            console.log(`✅ Found alternative selector: ${selector}`);
            break;
          } catch (e) {
            console.log(`❌ ${selector} not found`);
          }
        }
      }
      
      // Wait for dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const events = await page.evaluate(() => {
        const eventElements = [];
        
        console.log('🔍 Starting GAMH event extraction...');
        
        // Target the actual event containers
        const eventContainers = document.querySelectorAll('.seetickets-list-event-container');
        console.log(`Found ${eventContainers.length} .seetickets-list-event-container elements`);
        
        eventContainers.forEach((container, index) => {
          try {
            // Extract event title from the event-title class
            const titleElement = container.querySelector('.event-title a');
            const title = titleElement?.textContent?.trim();
            
            if (!title || title.length < 5) return;
            
            console.log(`Processing event ${index}: "${title}"`);
            
            // Extract REAL date from .event-date element
            const dateElement = container.querySelector('.event-date');
            const dateText = dateElement?.textContent?.trim();
            
            if (!dateText) {
              console.log(`⚠️ No date found for "${title}"`);
              return;
            }
            
            console.log(`📅 Date text: "${dateText}"`);
            
            // Parse the real date (format: "Fri Aug 22")
            const eventDate = parseGAMHDate(dateText);
            if (!eventDate) {
              console.log(`⚠️ Could not parse date "${dateText}" for "${title}"`);
              return;
            }
            
            console.log(`✅ Parsed date: ${eventDate.toISOString()}`);
            
            // Extract door time and show time from real elements
            const doorTimeElement = container.querySelector('.see-doortime');
            const showTimeElement = container.querySelector('.see-showtime');
            const doorTime = doorTimeElement?.textContent?.trim();
            const showTime = showTimeElement?.textContent?.trim();
            
            // Extract price from the price class
            const priceElement = container.querySelector('.price');
            const price = priceElement?.textContent?.trim();
            
            // Extract supporting talent/description
            const supportingElement = container.querySelector('.supporting-talent');
            const supporting = supportingElement?.textContent?.trim();
            
            // Extract genre
            const genreElement = container.querySelector('.genre');
            const genre = genreElement?.textContent?.trim();
            
            // Extract event URL
            const eventUrl = titleElement?.href || '';
            
            // Extract image URL
            const imageElement = container.querySelector('.seetickets-list-view-event-image');
            const imageUrl = imageElement?.src || '';
            
            // Extract event header/subtitle
            const headerElement = container.querySelector('.event-header');
            const header = headerElement?.textContent?.trim();
            
            // Create event object with REAL data
            const event = {
              title: title,
              date_start: eventDate.toISOString(),
              door_time: doorTime || '',
              show_time: showTime || '',
              cost: price || '',
              supporting_act: supporting || '',
              genre: genre || '',
              description: header ? `${header} - ${title}` : title,
              location: 'Great American Music Hall',
              source_url: eventUrl,
              image_url: imageUrl,
              source: 'gamh'
            };
            
            eventElements.push(event);
            console.log(`🎯 Created GAMH event: ${title} on ${eventDate.toISOString()}`);
            
          } catch (error) {
            console.log(`Error processing event container ${index}:`, error.message);
          }
        });
        
        console.log(`Total events created: ${eventElements.length}`);
        return eventElements;
        
        // Helper function to parse GAMH dates
        function parseGAMHDate(dateText) {
          try {
            // Format: "Fri Aug 22" (without year)
            const match = dateText.match(/^([A-Za-z]{3})\s+([A-Za-z]{3})\s+(\d{1,2})$/);
            if (!match) return null;
            
            const [, dayOfWeek, month, day] = match;
            
            const monthMap = {
              'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
              'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
            };
            
            const monthIndex = monthMap[month.toLowerCase()];
            if (monthIndex === undefined) return null;
            
            // Assume current year for now
            const currentYear = new Date().getFullYear();
            const eventDate = new Date(currentYear, monthIndex, parseInt(day));
            
            // If the date is in the past, it might be next year
            if (eventDate < new Date()) {
              eventDate.setFullYear(currentYear + 1);
            }
            
            // Only include future events
            const now = new Date();
            if (eventDate < now) return null;
            
            return eventDate;
          } catch (error) {
            console.warn(`⚠️ Error parsing GAMH date "${dateText}":`, error.message);
            return null;
          }
        }
      });
      
      await page.close();
      
      console.log(`✅ GAMH scraper found ${events.length} events`);
      return events;
      
    } catch (error) {
      console.error('❌ GAMH scraper failed:', error.message);
      return [];
    }
  }
}
