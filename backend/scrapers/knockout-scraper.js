import puppeteer from 'puppeteer';

export class KnockoutScraper {
  constructor() {
    this.name = 'Knockout';
    this.url = 'https://theknockoutsf.com/';
    this.category = 'Music';
  }

  async scrapeEvents() {
    console.log('🥊 Starting Knockout scraper...');
    
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.goto(this.url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      console.log('🌐 Loading page:', this.url);

      // Wait for the content to load - look for the homepage structure
      await page.waitForSelector('h1.eventlist-title, time.event-date', { timeout: 10000 });

      // Extract events from the homepage
      const events = await page.evaluate(() => {
        const events = [];
        
        // Get current date for reference
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        // Look for events in the next 30 days to catch more events
        const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

        // Get all event titles and their positions
        const eventTitles = Array.from(document.querySelectorAll('h1.eventlist-title'));
        const eventDates = Array.from(document.querySelectorAll('time.event-date'));
        const eventTimes = Array.from(document.querySelectorAll('time.event-time-localized-start'));
        
        // Process each title
        eventTitles.forEach((titleElement, index) => {
          try {
            const title = titleElement.textContent.trim();
            
            // Skip if this looks like navigation or generic text
            if (!title || title.includes('Skip to Content') || title.includes('The Knockout') || 
                title.includes('EVENTS') || title.includes('CALENDAR') || title.includes('BOOKING') || 
                title.includes('ABOUT') || title.includes('DICE EMBED EVENTS')) {
              return;
            }
            
            // Find the closest date and time elements
            let eventDate = null;
            let eventTime = null;
            
            // Look for date - should be nearby
            if (index < eventDates.length) {
              const dateElement = eventDates[index];
              const dateText = dateElement.textContent.trim();
              
              // Parse "Wednesday, August 20, 2025" format
              const dateMatch = dateText.match(/(\w+),\s+(\w+)\s+(\d{1,2}),\s+(\d{4})/i);
              if (dateMatch) {
                const dayName = dateMatch[1];
                const monthName = dateMatch[2];
                const day = parseInt(dateMatch[3]);
                const year = parseInt(dateMatch[4]);
                const month = getMonthNumber(monthName);
                if (month !== -1) {
                  eventDate = new Date(year, month, day);
                }
              }
            }
            
            // Look for time - should be nearby
            if (index < eventTimes.length) {
              const timeElement = eventTimes[index];
              const timeText = timeElement.textContent.trim();
              
              if (eventDate) {
                const timeMatch = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                if (timeMatch) {
                  const hour = parseInt(timeMatch[1]);
                  const minute = parseInt(timeMatch[2]);
                  const ampm = timeMatch[3].toUpperCase();
                  
                  eventDate.setHours(
                    ampm === 'PM' && hour !== 12 ? hour + 12 : (ampm === 'AM' && hour === 12 ? 0 : hour),
                    minute, 0, 0
                  );
                  eventTime = true; // Mark that we found a time
                }
              }
            }

            // Only include events within our 30-day window
            if (eventDate && eventDate >= today && eventDate <= thirtyDaysFromNow) {
              // Only set default time if no specific time was found
              if (!eventTime) {
                eventDate.setHours(21, 0, 0, 0); // Default to 9 PM only if no time found
              }
              
              events.push({
                title: title,
                description: `Live music at The Knockout - ${title}`,
                date_start: eventDate.toISOString(),
                location: 'The Knockout, San Francisco',
                source: 'knockout',
                source_url: 'https://theknockoutsf.com/',
                category: 'Music',
                price: 'Varies',
                image_url: ''
              });
            }
          } catch (error) {
            console.log('Error parsing event element:', error);
          }
        });

        // Helper functions
        function getMonthNumber(monthName) {
          const months = {
            'january': 0, 'jan': 0, 'february': 1, 'feb': 1, 'march': 2, 'mar': 2,
            'april': 3, 'apr': 3, 'may': 4, 'june': 5, 'july': 6, 'august': 7, 'aug': 7,
            'september': 8, 'sep': 8, 'october': 9, 'oct': 9, 'november': 10, 'nov': 10,
            'december': 11, 'dec': 11
          };
          return months[monthName.toLowerCase()] || -1;
        }

        return events;
      });

      await browser.close();
      
      console.log(`Found ${events.length} events from The Knockout`);
      return events;

    } catch (error) {
      console.error('❌ Error in Knockout scraper:', error);
      return [];
    }
  }
}

