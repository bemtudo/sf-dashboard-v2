import puppeteer from 'puppeteer';

async function scrapeCityArts() {
  console.log('🎭 Starting City Arts scraper...');
  const startTime = Date.now();
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('🌐 Loading City Arts events page...');
    await page.goto('https://www.cityarts.net/events/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for events to load
    await page.waitForSelector('.event', { timeout: 10000 });
    
    console.log('📄 Page loaded, extracting events...');
    
    const events = await page.evaluate(() => {
      const eventElements = document.querySelectorAll('.event');
      const extractedEvents = [];
      
      eventElements.forEach((eventEl, index) => {
        try {
          // Extract title
          const titleElement = eventEl.querySelector('.event-title a');
          if (!titleElement) return;
          
          const title = titleElement.textContent.trim();
          
          // Extract date
          const dateElement = eventEl.querySelector('.date');
          const dateText = dateElement ? dateElement.textContent.trim() : '';
          
          // Extract image
          const imageElement = eventEl.querySelector('.event-photo');
          const imageUrl = imageElement ? imageElement.src : '';
          
          // Extract ticket link
          const ticketElement = eventEl.querySelector('.button.tickets');
          const ticketUrl = ticketElement ? ticketElement.href : '';
          
          // Extract description (combine primary and secondary text)
          const primaryText = eventEl.querySelector('.primary')?.textContent.trim() || '';
          const secondaryText = eventEl.querySelector('.secondary')?.textContent.trim() || '';
          const description = [primaryText, secondaryText].filter(Boolean).join(' in conversation with ');
          
          // Parse date
          let eventDate = null;
          if (dateText) {
            try {
              // City Arts uses formats like "Fri, Sep 12" or "Mon, Feb 23, 2026"
              const dateMatch = dateText.match(/(\w{3}),\s+(\w{3})\s+(\d{1,2})(?:,\s+(\d{4}))?/);
              if (dateMatch) {
                const [, dayName, monthName, day, year] = dateMatch;
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthIndex = monthNames.indexOf(monthName);
                
                if (monthIndex !== -1) {
                  const currentYear = new Date().getFullYear();
                  const eventYear = year || currentYear;
                  eventDate = new Date(eventYear, monthIndex, parseInt(day));
                  
                  // If the date is in the past, assume it's next year
                  const now = new Date();
                  if (eventDate < now && !year) {
                    eventDate.setFullYear(currentYear + 1);
                  }
                  
                  // Only include future events
                  if (eventDate < now) return;
                }
              }
            } catch (error) {
              console.log(`⚠️ Could not parse date: "${dateText}"`);
            }
          }
          
          if (!eventDate) return;
          
          extractedEvents.push({
            title: title,
            description: description,
            date_start: eventDate.toISOString(),
            date_end: eventDate.toISOString(),
            time_text: 'Check website for showtimes',
            cost: ticketUrl ? 'Tickets available' : 'Free',
            supporting_act: '',
            genre: 'Literature & Lectures',
            location: 'San Francisco, CA',
            source: 'City Arts & Lectures',
            source_url: 'https://www.cityarts.net/events/',
            image_url: imageUrl,
            category: 'Books & Literature',
            price: ticketUrl ? 'Tickets available' : 'Free',
            host: 'City Arts & Lectures',
            venue: 'City Arts & Lectures',
            event_url: ticketUrl || 'https://www.cityarts.net/events/'
          });
          
        } catch (error) {
          console.log(`⚠️ Error processing event ${index + 1}:`, error.message);
        }
      });
      
      return extractedEvents;
    });
    
    console.log(`✅ City Arts scraper found ${events.length} events`);
    
    // Filter out any events without valid dates
    const validEvents = events.filter(event => event.date_start);
    
    console.log(`✅ City Arts scraper completed: ${validEvents.length} valid events found in ${Date.now() - startTime}ms`);
    
    return validEvents;
    
  } catch (error) {
    console.error('❌ City Arts scraper failed:', error.message);
    return [];
  } finally {
    if (browser) {
      await browser.close();
      console.log('🧹 City Arts browser closed successfully');
    }
  }
}

export { scrapeCityArts };
