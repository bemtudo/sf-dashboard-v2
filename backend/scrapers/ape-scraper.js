import { BaseScraper } from './base-scraper.js';
import * as cheerio from 'cheerio';

export class APEScraper extends BaseScraper {
  constructor() {
    super('ape', {
      url: 'https://apeconcerts.com/calendar/',
      name: 'Another Planet Entertainment'
    });
  }

  async scrapeEvents() {
    try {
      console.log('🎵 Scraping APE Concerts events...');
      
      // Get browser from BaseScraper (already initialized by scrape() method)
      const page = await this.browser.newPage();
      
      // Use the correct URL from config
      const url = this.config.url;
      console.log(`🌐 Loading page: ${url}`);
      
      // Try different loading strategies to handle slow/complex websites
      console.log('🌐 Attempting to load APE page...');
      
      try {
        // Strategy 1: Try with networkidle2 (less strict)
        await page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: 60000  // Increase timeout to 60 seconds
        });
        console.log('✅ APE page loaded with networkidle2');
      } catch (error) {
        console.log('⚠️ networkidle2 failed, trying domcontentloaded...');
        try {
          // Strategy 2: Try with just domcontentloaded
          await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000
          });
          console.log('✅ APE page loaded with domcontentloaded');
        } catch (error2) {
          console.log('⚠️ domcontentloaded failed, trying load...');
          // Strategy 3: Try with just load
          await page.goto(url, { 
            waitUntil: 'load',
            timeout: 20000
          });
          console.log('✅ APE page loaded with load');
        }
      }
      
      console.log('🌐 APE page loaded, waiting for content...');
      
      // Wait for the event content to load - look for article.event elements
      try {
        await page.waitForSelector('article.event', { timeout: 5000 });
        console.log('✅ Found article.event elements, content loaded');
      } catch (error) {
        console.log('⚠️ Timeout waiting for article.event elements, proceeding anyway');
        // Try to wait for any content at all
        try {
          await page.waitForSelector('.event', { timeout: 5000 });
          console.log('✅ Found .event elements, content loaded');
        } catch (error2) {
          console.log('⚠️ No event elements found, proceeding with whatever content is available');
        }
      }
      
      // Wait a bit more for any additional content to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get the HTML content
      const html = await page.content();
      
      await page.close();
      
      if (!html) {
        throw new Error('Failed to load APE website');
      }
      
      console.log(`📄 APE page loaded: ${html.length} characters`);
      
      // Debug: Check if we can see the expected content
      if (html.includes('event') || html.includes('Mae Powell')) {
        console.log('✅ Found expected content in HTML');
      } else {
        console.log('❌ Expected content not found in HTML');
        console.log('HTML preview:', html.substring(0, 1000));
      }
      
      // Also check for specific elements
      if (html.includes('article class="event"')) {
        console.log('✅ Found article.event elements in HTML');
      } else {
        console.log('❌ No article.event elements found in HTML');
      }
      
      if (html.includes('apeconcerts.com')) {
        console.log('✅ Found apeconcerts.com in HTML');
      } else {
        console.log('❌ No apeconcerts.com found in HTML');
      }
      
      const $ = cheerio.load(html);
      const events = [];
      const seenEvents = new Set();
      
      // Get current Pacific date for filtering
      const now = new Date();
      const pacificTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
      const todayDateOnly = new Date(pacificTime.getFullYear(), pacificTime.getMonth(), pacificTime.getDate());
      const sevenDaysFromNow = new Date(todayDateOnly);
      sevenDaysFromNow.setDate(todayDateOnly.getDate() + 7);
      
      console.log(`📅 Looking for APE concerts from ${todayDateOnly.toDateString()} to ${sevenDaysFromNow.toDateString()}`);
      
      // Strategy 1: Look for event listings - try multiple selectors
      const eventSelectors = [
        'article.event',    // This is the main selector we can see in the HTML
        '.event',           // Fallback to just event class
        '.event-wrapper'    // Event wrapper
      ];
      
      let foundEvents = false;
      
      for (const selector of eventSelectors) {
        const eventElements = $(selector);
        console.log(`🔍 Selector "${selector}" found ${eventElements.length} elements`);
        
        if (eventElements.length > 0) {
          console.log(`🔍 Found ${eventElements.length} potential events using selector: ${selector}`);
          foundEvents = true;
          
          eventElements.each((i, element) => {
            try {
              const $element = $(element);
              
              // Debug: Log what we found
              console.log(`\n--- Processing event ${i} with selector ${selector} ---`);
              
              // Extract event details using the exact selectors from the HTML
              const title = $element.find('.attraction_title, .show-title, h2').first().text().trim();
              const venue = $element.find('.venue-location-name').first().text().trim();
              const dateText = $element.find('.event__start-date').first().text().trim();
              const link = $element.find('a').first().attr('href');
              const imageUrl = $element.find('img').first().attr('src');
              
              console.log(`Title: "${title}"`);
              console.log(`Venue: "${venue}"`);
              console.log(`Date: "${dateText}"`);
              console.log(`Link: "${link}"`);
              
              if (!title || title.length < 3) {
                console.log(`⏭️ Skipping event with no title: ${title}`);
                return;
              }
              
              // Skip generic navigation/UI elements
              if (this.isGenericTitle(title)) {
                console.log(`⏭️ Skipping generic element: ${title}`);
                return;
              }
              
              // Try to parse date - APE uses format like "Thu Aug 21"
              let eventDate = null;
              if (dateText) {
                // Parse APE date format: "Thu Aug 21"
                const dateMatch = dateText.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})/i);
                if (dateMatch) {
                  const month = dateMatch[2];
                  const day = dateMatch[3];
                  const year = 2025; // Current year
                  
                  const monthMap = {
                    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
                  };
                  
                  const monthNum = monthMap[month];
                  const dayNum = day.padStart(2, '0');
                  
                  // Create ISO date string
                  eventDate = `${year}-${monthNum}-${dayNum}`;
                  console.log(`Parsed APE date: ${eventDate} from "${dateText}"`);
                } else {
                  // Try the existing parseDate method as fallback
                  eventDate = this.parseDate(dateText);
                }
              }
              
              // If no date found, try extracting from text content
              if (!eventDate) {
                const fullText = this.cleanText($element.text());
                const dateMatch = fullText.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[^\d]*(\d{1,2})[^\d]*(January|February|March|April|May|June|July|August|September|October|November|December)[^\d]*(\d{4})?/i);
                if (dateMatch) {
                  const month = dateMatch[3];
                  const day = dateMatch[2];
                  const year = dateMatch[4] || new Date().getFullYear();
                  eventDate = this.parseDate(`${month} ${day}, ${year}`);
                }
              }
              
              // If still no date, use a placeholder for upcoming events
              if (!eventDate) {
                console.log(`⚠️ No date found for APE event: ${title}`);
                return; // Skip events without dates
              }
              
              // Validate date is within our range
              const parsedDate = new Date(eventDate);
              const eventDateOnly = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
              
              // TEMPORARILY COMMENT OUT DATE FILTERING FOR DEBUGGING
              /*
              if (eventDateOnly < todayDateOnly || eventDateOnly > sevenDaysFromNow) {
                console.log(`⏭️ Skipping APE event outside date range: ${title} on ${eventDateOnly.toDateString()}`);
                return;
              }
              */
              
              console.log(`✅ Date validation passed: ${title} on ${eventDateOnly.toDateString()}`);
              
              // Create unique identifier for deduplication
              const uniqueId = `${title}-${eventDateOnly.toISOString().split('T')[0]}`;
              if (seenEvents.has(uniqueId)) {
                console.log(`⏭️ Skipping duplicate APE event: ${title}`);
                return;
              }
              seenEvents.add(uniqueId);
              
              const eventObj = {
                title: title,
                description: `${title} - Concert presented by Another Planet Entertainment`,
                date_start: eventDate,
                location: venue || 'San Francisco Bay Area',
                source: 'ape',
                source_url: link ? (link.startsWith('http') ? link : `https://apeconcerts.com${link}`) : this.url,
                category: 'Music',
                price: 'Varies',
                image_url: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `https://apeconcerts.com${imageUrl}`) : '',
                host: 'Another Planet Entertainment'
              };
              
              // Validate event before adding
              if (this.validateEventData(eventObj)) {
                events.push(eventObj);
                console.log(`🎯 Found APE concert: ${eventObj.title} on ${eventObj.date_start}`);
              }
              
            } catch (error) {
              console.warn(`⚠️ Error parsing APE event ${i}:`, error.message);
            }
          });
          
          // If we found events with this selector, break out of the loop
          if (events.length > 0) {
            break;
          }
        }
      }
      
      // Strategy 2: If no events found with specific selectors, try broader approach
      if (!foundEvents || events.length === 0) {
        console.log('🔄 No events found with specific selectors, trying broader approach...');
        
        // Look for any text that might contain concert information
        const textElements = $('div, section, article, li').filter((i, el) => {
          const text = $(el).text().toLowerCase();
          return text.includes('concert') || text.includes('show') || text.includes('tour') || text.includes('performance');
        });
        
        console.log(`🔍 Found ${textElements.length} potential concert-related elements`);
        
        textElements.slice(0, 10).each((i, element) => { // Limit to first 10 to avoid spam
          try {
            const $element = $(element);
            const text = this.cleanText($element.text());
            
            // Look for artist names and dates in the text
            const artistMatch = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g);
            const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{4}|January|February|March|April|May|June|July|August|September|October|November|December)/i);
            
            if (artistMatch && dateMatch && text.length < 200) {
              const title = artistMatch[0];
              const dateText = dateMatch[0];
              
              if (title && title.length > 3 && !this.isGenericTitle(title)) {
                const eventDate = this.parseDate(dateText);
                if (eventDate) {
                  const parsedDate = new Date(eventDate);
                  const eventDateOnly = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
                  
                  if (eventDateOnly >= todayDateOnly && eventDateOnly <= sevenDaysFromNow) {
                    const uniqueId = `${title}-${eventDateOnly.toISOString().split('T')[0]}`;
                    if (!seenEvents.has(uniqueId)) {
                      seenEvents.add(uniqueId);
                      
                      const eventObj = {
                        title: title,
                        description: `${title} - Concert presented by Another Planet Entertainment`,
                        date_start: eventDate,
                        location: 'San Francisco Bay Area',
                        source: 'ape',
                        source_url: this.url,
                        category: 'Music',
                        price: 'Varies',
                        image_url: '',
                        host: 'Another Planet Entertainment'
                      };
                      
                      if (this.validateEventData(eventObj)) {
                        events.push(eventObj);
                        console.log(`🎯 Found APE concert (broad): ${eventObj.title} on ${eventObj.date_start}`);
                      }
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.warn(`⚠️ Error parsing broad APE element ${i}:`, error.message);
          }
        });
      }
      
      console.log(`✅ APE Concerts scraper found ${events.length} events`);
      
      return {
        success: true,
        events: events,
        count: events.length
      };

    } catch (error) {
      console.error('❌ Error scraping APE Concerts events:', error);
      throw error;
    }
  }
  
  // Helper method to parse date strings into Pacific timezone format
  parseDate(dateString) {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return null;
      }
      
      // Convert to Pacific timezone format
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      // Default to 8pm for concerts if no time specified
      return `${year}-${month}-${day}T20:00:00-07:00`;
      
    } catch (error) {
      console.warn(`⚠️ Error parsing date: ${dateString}`);
      return null;
    }
  }
}