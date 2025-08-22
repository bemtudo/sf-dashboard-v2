import puppeteer from 'puppeteer';

export class RickshawStopScraper {
  constructor() {
    this.name = 'Rickshaw Stop';
    this.url = 'https://rickshawstop.com/calendar/';
    this.category = 'Music';
  }

  async scrapeEvents() {
    console.log('🎵 Starting Rickshaw Stop scraper...');

    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.goto(this.url, { waitUntil: 'networkidle2', timeout: 30000 });

      console.log('🌐 Loading page:', this.url);

      // Wait for the calendar event containers to load
      await page.waitForSelector('.seetickets-calendar-event-container', { timeout: 15000 });
      
      // Use a simple delay function instead of waitFor/waitForTimeout
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      await delay(3000);

      // Extract events using the correct selectors from the HTML
      const events = await page.evaluate(() => {
        const events = [];
        
        // Get current date for reference
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

        // Look for calendar event containers
        const eventContainers = document.querySelectorAll('.seetickets-calendar-event-container');
        
        eventContainers.forEach((container) => {
          try {
            // Get event title from the title link
            const titleElement = container.querySelector('.seetickets-calendar-event-title a');
            if (!titleElement) return;
            const title = titleElement.textContent.trim();

            // Get event date from the calendar position
            // We need to find the parent td element to get the date
            let parentTd = container.closest('td');
            if (!parentTd) return;
            
            // Find the date number element in this td
            const dateElement = parentTd.querySelector('.date-number');
            if (!dateElement) return;
            
            const day = parseInt(dateElement.textContent);
            if (isNaN(day)) return;
            
            // Get the month from the calendar header
            let month = now.getMonth(); // Default to current month
            let year = now.getFullYear();
            
            // Look for month headers above this calendar
            let calendarSection = parentTd.closest('table');
            if (calendarSection) {
              let prevElement = calendarSection.previousElementSibling;
              while (prevElement) {
                if (prevElement.classList.contains('seetickets-calendar-year-month-container')) {
                  const monthText = prevElement.textContent;
                  const monthMatch = monthText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)/i);
                  if (monthMatch) {
                    month = getMonthNumber(monthMatch[1]);
                    // If month is before current month, it's next year
                    if (month < now.getMonth()) {
                      year = now.getFullYear() + 1;
                    }
                    break;
                  }
                }
                prevElement = prevElement.previousElementSibling;
              }
            }
            
            // Create date for the event
            const eventDate = new Date(year, month, day);
            
            // Only include events within our 30-day window
            if (eventDate < today || eventDate > thirtyDaysFromNow) return;
            
            // Get time information
            const timeElement = container.querySelector('.doortime-showtime');
            let eventTime = '8:00 PM'; // Default time
            if (timeElement) {
              const timeText = timeElement.textContent;
              const timeMatch = timeText.match(/Show at\s+(\d{1,2}):(\d{2})(AM|PM)/i);
              if (timeMatch) {
                const hour = parseInt(timeMatch[1]);
                const minute = parseInt(timeMatch[2]);
                const ampm = timeMatch[3].toUpperCase();
                eventTime = `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
              }
            }

            // Set the time on the event date
            const timeMatch = eventTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (timeMatch) {
              const hour = parseInt(timeMatch[1]);
              const minute = parseInt(timeMatch[2]);
              const ampm = timeMatch[3].toUpperCase();
              
              eventDate.setHours(
                ampm === 'PM' && hour !== 12 ? hour + 12 : (ampm === 'AM' && hour === 12 ? 0 : hour),
                minute, 0, 0
              );
            }

            // Get price information
            const priceElement = container.querySelector('.seetickets-buy-btn');
            let eventPrice = 'Varies';
            if (priceElement) {
              const priceText = priceElement.textContent.trim();
              if (priceText === 'Buy Tickets') {
                eventPrice = 'Tickets Available';
              } else if (priceText === 'Box Office Only') {
                eventPrice = 'Box Office Only';
              } else if (priceText === 'Sold Out') {
                eventPrice = 'Sold Out';
              } else if (priceText === 'Coming Soon') {
                eventPrice = 'Coming Soon';
              }
            }

            // Get genre/description
            const genreElement = container.querySelector('.supporting-talent');
            let description = `Live music at Rickshaw Stop - ${title}`;
            if (genreElement) {
              description += ` (${genreElement.textContent.trim()})`;
            }

            events.push({
              title: title,
              description: description,
              date_start: eventDate.toISOString(),
              location: 'Rickshaw Stop, San Francisco',
              source: 'rickshawstop',
              source_url: 'https://rickshawstop.com/calendar/',
              category: 'Music',
              price: eventPrice,
              image_url: ''
            });

          } catch (error) {
            console.log('Error parsing event container:', error);
          }
        });

        // Helper function to get month number
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

      console.log(`Found ${events.length} events from Rickshaw Stop`);
      return events;

    } catch (error) {
      console.error('❌ Error in Rickshaw Stop scraper:', error);
      return [];
    }
  }
}
