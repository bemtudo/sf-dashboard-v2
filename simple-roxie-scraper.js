#!/usr/bin/env node
// Simple Roxie Theater Scraper - Implements the 3-step strategy
// Uses built-in Node.js modules to avoid dependency issues

import puppeteer from 'puppeteer';

class SimpleRoxieScraper {
  constructor() {
    this.url = 'https://roxie.com/calendar/';
    this.name = 'The Roxie Theater';
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrape() {
    try {
      console.log('🚀 Starting Roxie Theater scraper...');
      
      // Step 1: Get basic event data from RSS feed
      console.log('📡 Step 1: Fetching RSS feed for basic event data...');
      const rssEvents = await this.scrapeRssFeed();
      
      if (rssEvents.length === 0) {
        console.log('⚠️ No events found in RSS feed, trying calendar fallback...');
        const calendarEvents = await this.scrapeCalendarFallback();
        return {
          success: true,
          events: calendarEvents,
          count: calendarEvents.length,
          duration: 0
        };
      }
      
      console.log(`✅ Found ${rssEvents.length} events from RSS feed`);
      
      // Step 2: Enrich each event with details from individual film pages
      console.log('🔍 Step 2: Enriching events with film page data...');
      const enrichedEvents = await this.enrichEventsFromFilmPages(rssEvents);
      
      // Step 3: Filter to only future events within 14 days
      console.log('🎯 Step 3: Filtering to future events within 14 days...');
      const filteredEvents = this.filterFutureEvents(enrichedEvents);
      
      console.log(`✅ Found ${rssEvents.length} total events, ${filteredEvents.length} future events within 14 days`);
      
      return {
        success: true,
        events: filteredEvents,
        count: filteredEvents.length,
        duration: 0
      };
    } catch (error) {
      console.error('❌ Error scraping Roxie Theater:', error);
      return {
        success: false,
        events: [],
        count: 0,
        duration: 0,
        error: error.message
      };
    } finally {
      await this.closeBrowser();
    }
  }

  async getPageContent(url) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      // Set user agent to avoid being blocked
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });
      
      console.log(`🌐 Loading page: ${url}`);
      
      // Navigate to page
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      console.log(`⏳ Waiting for dynamic content to load...`);
      
      // Wait longer for dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Get page content
      const content = await page.content();
      console.log(`📄 Page loaded, content length: ${content.length} characters`);
      
      // Debug: Check if we can find calendar elements
      const calendarDays = await page.$$('.calendar-day-item');
      const filmElements = await page.$$('span.film');
      const filmTitles = await page.$$('.film-title');
      const showtimes = await page.$$('.film-showtime');
      
      console.log(`🔍 Found elements: ${calendarDays.length} calendar days, ${filmElements.length} films, ${filmTitles.length} titles, ${showtimes.length} showtimes`);
      
      await page.close();
      return content;
      
    } catch (error) {
      throw new Error(`Failed to fetch ${url}: ${error.message}`);
    }
  }

  // Step 1: Scrape RSS feed for basic event data
  async scrapeRssFeed() {
    try {
      // Use Puppeteer to fetch RSS feed (more reliable than fetch)
      const rssContent = await this.getPageContent('https://roxie.com/upcoming_events');
      if (!rssContent) return [];
      
      const events = [];
      
      // Parse RSS content using regex (simpler than XML parser)
      const itemMatches = rssContent.match(/<item>([\s\S]*?)<\/item>/gi);
      
      if (itemMatches) {
        itemMatches.forEach((item, index) => {
          try {
            // Extract title
            const titleMatch = item.match(/<title>([^<]+)<\/title>/i);
            if (!titleMatch) return;
            
            const title = this.cleanText(titleMatch[1]);
            if (!title || this.isGenericTitle(title)) return;
            
            // Extract link (film URL)
            const linkMatch = item.match(/<link>([^<]+)<\/link>/i);
            if (!linkMatch) return;
            
            const filmUrl = linkMatch[1];
            
            // Extract description
            const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i);
            const description = descMatch ? this.cleanText(descMatch[1]) : '';
            
            // Extract date from description
            const dateMatch = description.match(/(?:Until\s+)?(\w+\s+\d{1,2},?\s+\d{4})/);
            let eventDate = null;
            
            if (dateMatch) {
              const dateText = dateMatch[1];
              eventDate = this.parseRoxieDate(dateText);
            }
            
            if (!eventDate) {
              console.log(`⚠️ Could not parse date for "${title}", skipping`);
              return;
            }
            
            console.log(`🔍 Found event: "${title}" on ${eventDate} at ${filmUrl}`);
            
            const event = {
              title: title,
              description: description,
              date_start: eventDate,
              location: `${this.name}, San Francisco`,
              source: 'roxie',
              source_url: 'https://roxie.com/upcoming_events',
              category: 'Film',
              price: 'Varies',
              image_url: '',
              screen: '',
              film_url: filmUrl
            };
            
            if (this.validateEventData(event)) {
              events.push(event);
            }
          } catch (error) {
            console.warn(`⚠️ Error processing RSS item ${index}: ${error.message}`);
          }
        });
      }
      
      return events;
    } catch (error) {
      console.error('❌ Error scraping RSS feed:', error.message);
      return [];
    }
  }

  // Step 2: Enrich events with details from individual film pages
  async enrichEventsFromFilmPages(events) {
    const enrichedEvents = [];
    
    for (const event of events) {
      if (event.film_url) {
        try {
          console.log(`🔍 Enriching event "${event.title}" from ${event.film_url}`);
          const enrichedEvent = await this.enrichEventFromFilmPage(event);
          enrichedEvents.push(enrichedEvent);
        } catch (error) {
          console.log(`❌ Failed to enrich event "${event.title}": ${error.message}`);
          enrichedEvents.push(event); // Add unenriched event as fallback
        }
      } else {
        enrichedEvents.push(event);
      }
    }
    
    return enrichedEvents;
  }

  // Enrich a single event with film page data
  async enrichEventFromFilmPage(event) {
    try {
      const page = await this.getPageContent(event.film_url);
      if (!page) return event;
      
      // Extract screen information (Big Roxie or Little Roxie)
      const screenMatch = page.match(/Location[^<]*<\/[^>]*>[^<]*<[^>]*>([^<]+)/i);
      if (screenMatch) {
        const screenText = this.cleanText(screenMatch[1]);
        if (screenText && (screenText.includes('Big Roxie') || screenText.includes('Little Roxie'))) {
          event.screen = screenText;
        }
      }
      
      // Extract film poster image
      const imageMatch = page.match(/<img[^>]*src="([^"]*wp-content\/uploads[^"]*\.(?:jpg|png))"[^>]*>/i);
      if (imageMatch) {
        const imageUrl = imageMatch[1];
        if (imageUrl && !imageUrl.includes('letterboxd') && !imageUrl.includes('letterlogo')) {
          event.image_url = imageUrl;
        }
      }
      
      // Extract showtimes and create multiple events
      const showtimeMatches = page.match(/<span[^>]*class="[^"]*film-showtime[^"]*"[^>]*>([^<]+)<\/span>/gi);
      if (showtimeMatches && showtimeMatches.length > 0) {
        const showtimes = [];
        showtimeMatches.forEach(showtimeHtml => {
          const timeMatch = showtimeHtml.match(/<span[^>]*class="[^"]*film-showtime[^"]*"[^>]*>([^<]+)<\/span>/i);
          if (timeMatch) {
            const timeText = this.cleanText(timeMatch[1]);
            if (timeText) showtimes.push(timeText);
          }
        });
        
        if (showtimes.length > 0) {
          console.log(`🎬 Found showtimes for "${event.title}": ${showtimes.join(', ')}`);
          
          // Create a separate event for each showtime
          const eventsWithTimes = [];
          for (const showtime of showtimes) {
            const eventDateTime = this.combineDateAndTime(new Date(event.date_start), showtime);
            if (eventDateTime) {
              const timeSpecificEvent = {
                ...event,
                date_start: eventDateTime,
                time: showtime
              };
              eventsWithTimes.push(timeSpecificEvent);
            }
          }
          
          // Return the first event with time (we'll handle multiple events in the main flow)
          if (eventsWithTimes.length > 0) {
            return eventsWithTimes[0];
          }
        }
      }
      
      return event;
    } catch (error) {
      console.warn(`⚠️ Error enriching event "${event.title}": ${error.message}`);
      return event;
    }
  }

  // Calendar fallback method
  async scrapeCalendarFallback() {
    try {
      console.log('📅 Using calendar fallback method...');
      const page = await this.getPageContent(this.url);
      if (!page) return [];
      
      console.log(`📄 Calendar page loaded, content length: ${page.length} characters`);
      
      // Debug: Check what elements we can find
      const calendarDayMatches = page.match(/<div[^>]*class="[^"]*calendar-day-item[^"]*"[^>]*>/gi);
      const filmMatches = page.match(/<span[^>]*class="[^"]*film[^"]*"[^>]*>/gi);
      const titleMatches = page.match(/<p[^>]*class="[^"]*film-title[^"]*"[^>]*>/gi);
      const showtimeMatches = page.match(/<span[^>]*class="[^"]*film-showtime[^"]*"[^>]*>/gi);
      
      console.log(`🔍 Debug - Found elements: ${calendarDayMatches?.length || 0} calendar days, ${filmMatches?.length || 0} films, ${titleMatches?.length || 0} titles, ${showtimeMatches?.length || 0} showtimes`);
      
      // Also check for any text that might indicate films
      if (page.includes('film-title')) {
        console.log('✅ Found film-title class in page');
      } else {
        console.log('❌ No film-title class found in page');
      }
      
      if (page.includes('film-showtime')) {
        console.log('✅ Found film-showtime class in page');
      } else {
        console.log('❌ No film-showtime class found in page');
      }
      
      return this.extractFromCalendar(page);
    } catch (error) {
      console.error('❌ Calendar fallback failed:', error.message);
      return [];
    }
  }

  // 🎯 SCHEMA.ORG JSON-LD EXTRACTION
  extractSchemaData(html) {
    const events = [];
    
    // Look for JSON-LD scripts
    const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    
    if (jsonLdMatches) {
      jsonLdMatches.forEach((script, index) => {
        try {
          // Extract JSON content
          const jsonContent = script.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
          const data = JSON.parse(jsonContent);
          
          // Handle arrays and single objects
          const items = Array.isArray(data) ? data : [data];
          
          items.forEach(item => {
            if (item['@type'] === 'Event' || item['@type'] === 'ScreeningEvent' || item['@type'] === 'Movie') {
              const event = {
                title: item.name || item.title || 'Film Screening',
                description: item.description || `Film screening at ${this.name}`,
                date_start: item.startDate || item.datePublished || item.dateCreated,
                location: item.location?.name || item.location || `${this.name}, San Francisco`,
                source: 'roxie',
                source_url: item.url || this.url,
                category: 'Film',
                price: item.offers?.price || 'Varies',
                image_url: item.image || item.poster || ''
              };
              
              if (this.validateEventData(event)) {
                events.push(event);
              }
            }
          });
        } catch (error) {
          console.warn(`⚠️ Failed to parse JSON-LD script ${index}:`, error.message);
        }
      });
    }
    
    return events;
  }

  // 🎯 CALENDAR PARSING - Parse the actual calendar structure
  extractFromCalendar(html) {
    const events = [];
    
    // Use a simple HTML parser to find calendar elements
    const calendarDayMatches = html.match(/<div[^>]*class="[^"]*calendar-day-item[^"]*"[^>]*>([\s\S]*?)<\/div>/gi);
    
    if (calendarDayMatches) {
      console.log(`🔍 Found ${calendarDayMatches.length} calendar day elements`);
      
      calendarDayMatches.forEach((dayHtml, dayIndex) => {
        try {
          // Extract day number
          const dayMatch = dayHtml.match(/<span[^>]*class="[^"]*calendar-day[^"]*"[^>]*>(\d+)<\/span>/i);
          if (!dayMatch) return;
          
          const day = parseInt(dayMatch[1]);
          if (isNaN(day)) return;
          
          // Extract month and year from the month container
          const monthMatch = html.match(/<h2[^>]*class="[^"]*calendar-block__month-title[^"]*"[^>]*>(\w+)\s+(\d{4})<\/h2>/i);
          if (!monthMatch) return;
          
          const monthName = monthMatch[1];
          const year = parseInt(monthMatch[2]);
          const monthIndex = this.getMonthIndex(monthName);
          
          // Create the date for this day
          const eventDate = new Date(year, monthIndex, day);
          
          console.log(`📅 Processing day ${monthName} ${day}, ${year}`);
          
          // Find all films for this day
          const filmMatches = dayHtml.match(/<span[^>]*class="[^"]*film[^"]*"[^>]*>([\s\S]*?)<\/span>/gi);
          
          if (filmMatches) {
            filmMatches.forEach((filmHtml, filmIndex) => {
              try {
                // Extract film title
                const titleMatch = filmHtml.match(/<p[^>]*class="[^"]*film-title[^"]*"[^>]*>([^<]+)<\/p>/i);
                if (!titleMatch) return;
                
                const title = this.cleanText(titleMatch[1]);
                if (!title || this.isGenericTitle(title)) return;
                
                // Extract showtimes
                const showtimeMatches = filmHtml.match(/<span[^>]*class="[^"]*film-showtime[^"]*"[^>]*>([^<]+)<\/span>/gi);
                const showtimes = [];
                
                if (showtimeMatches) {
                  showtimeMatches.forEach(showtimeHtml => {
                    const timeMatch = showtimeHtml.match(/<span[^>]*class="[^"]*film-showtime[^"]*"[^>]*>([^<]+)<\/span>/i);
                    if (timeMatch) {
                      const timeText = this.cleanText(timeMatch[1]);
                      if (timeText) showtimes.push(timeText);
                    }
                  });
                }
                
                if (showtimes.length === 0) return;
                
                // Extract film URL
                const urlMatch = filmHtml.match(/<a[^>]*href="([^"]*\/film\/[^"]*)"[^>]*>/i);
                const filmUrl = urlMatch ? urlMatch[1] : '';
                
                console.log(`🔍 Found film "${title}" on ${monthName} ${day} with showtimes: ${showtimes.join(', ')}`);
                
                // For each showtime, create an event
                for (const showtime of showtimes) {
                  const eventDateTime = this.combineDateAndTime(eventDate, showtime);
                  if (!eventDateTime) continue;
                  
                  const event = {
                    title: title,
                    description: `Film screening at ${this.name}`,
                    date_start: eventDateTime,
                    location: `${this.name}, San Francisco`,
                    source: 'roxie',
                    source_url: this.url,
                    category: 'Film',
                    price: 'Varies',
                    image_url: '',
                    film_url: filmUrl
                  };
                  
                  if (this.validateEventData(event)) {
                    events.push(event);
                  }
                }
              } catch (error) {
                console.warn(`⚠️ Error processing film ${filmIndex}: ${error.message}`);
              }
            });
          }
        } catch (error) {
          console.warn(`⚠️ Error processing day ${dayIndex}: ${error.message}`);
        }
      });
    }
    
    return events;
  }

  // 🎯 CONTENT ANALYSIS FALLBACK
  extractFromContent(html) {
    const events = [];
    
    // Look for film-related content patterns
    const filmPatterns = [
      /(?:film|movie|screening).*?(?:at|in|on).*?(?:roxie|theater)/gi,
      /(?:tonight|tomorrow|this week|next week).*?(?:film|movie|screening)/gi
    ];
    
    // Look for date patterns
    const datePatterns = [
      /(\w+)\s+(\d{1,2}),?\s+(\d{4})/g,  // Month DD, YYYY
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,  // MM/DD/YYYY
      /(\d{4})-(\d{1,2})-(\d{1,2})/g     // YYYY-MM-DD
    ];
    
    // This is a basic fallback - in practice you'd want more sophisticated analysis
    if (filmPatterns.some(pattern => pattern.test(html))) {
      // Create a basic event based on content analysis
      events.push({
        title: 'Film Screening at The Roxie',
        description: 'Film screening at The Roxie Theater (details extracted from page content)',
        date_start: new Date().toISOString(), // Default to today
        location: 'The Roxie Theater, San Francisco',
        source: 'roxie',
        source_url: this.url,
        category: 'Film',
        price: 'Varies',
        image_url: ''
      });
    }
    
    return events;
  }

  // Validate extracted event data
  validateEventData(event) {
    const required = ['title', 'date_start'];
    const hasRequired = required.every(field => event[field] && event[field].toString().length > 0);
    
    if (!hasRequired) return false;
    
    // Title should be reasonable length
    if (event.title.length < 3 || event.title.length > 200) return false;
    
    // Date should be valid
    if (event.date_start && isNaN(new Date(event.date_start).getTime())) return false;
    
    return true;
  }

  // 🎯 FILTER: Only future events within 14 days
  filterFutureEvents(events) {
    const now = new Date();
    const fourteenDaysFromNow = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
    
    return events.filter(event => {
      if (!event.date_start) return false;
      
      const eventDate = new Date(event.date_start);
      const isFuture = eventDate > now;
      const isWithin14Days = eventDate <= fourteenDaysFromNow;
      
      return isFuture && isWithin14Days;
    });
  }

  // Helper method to clean text
  cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  }

  // Helper method to check if a title is generic website content
  isGenericTitle(title) {
    if (!title || title.length < 3) return true;
    
    const genericTerms = [
      'event spaces', 'get in touch', 'cookies', 'privacy policy', 'terms of service',
      'about us', 'contact', 'home', 'menu', 'navigation', 'search', 'login', 'sign up',
      'subscribe', 'newsletter', 'footer', 'header', 'sidebar', 'advertisement', 'sponsored',
      'click here', 'read more', 'learn more', 'shop now', 'buy now', 'order now'
    ];
    
    const lowerTitle = title.toLowerCase();
    return genericTerms.some(term => lowerTitle.includes(term));
  }

  // Helper method to get month index from month name
  getMonthIndex(monthName) {
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    
    const monthIndex = months.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
    return monthIndex >= 0 ? monthIndex : 0;
  }

  // Helper method to combine date and time
  combineDateAndTime(date, timeText) {
    try {
      if (!date || !timeText) return null;
      
      const timeMatch = timeText.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
      if (!timeMatch) return null;
      
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const period = timeMatch[3].toLowerCase();
      
      // Convert to 24-hour format
      if (period === 'pm' && hours !== 12) {
        hours += 12;
      } else if (period === 'am' && hours === 12) {
        hours = 0;
      }
      
      // Create new date with the time
      const eventDateTime = new Date(date);
      eventDateTime.setHours(hours, minutes, 0, 0);
      
      return eventDateTime.toISOString();
    } catch (error) {
      console.warn(`⚠️ Error combining date and time: ${error.message}`);
      return null;
    }
  }

  // Helper method to parse date strings like "Jan 15, 2024" or "Jan 15, 2024 - Jan 21, 2024"
  parseRoxieDate(dateText) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    let startDate, endDate;

    if (dateText.includes(' - ')) {
      const [start, end] = dateText.split(' - ');
      startDate = this.parseSingleDate(start, currentYear, currentMonth, currentDay);
      endDate = this.parseSingleDate(end, currentYear, currentMonth, currentDay);
      if (startDate && endDate) {
        return startDate;
      }
    } else {
      startDate = this.parseSingleDate(dateText, currentYear, currentMonth, currentDay);
      if (startDate) {
        return startDate;
      }
    }

    return null;
  }

  // Helper method to parse a single date string like "Jan 15, 2024"
  parseSingleDate(dateText, currentYear, currentMonth, currentDay) {
    const monthMatch = dateText.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/i);
    if (monthMatch) {
      const monthName = monthMatch[1].toLowerCase();
      const monthIndex = this.getMonthIndex(monthName);
      const day = parseInt(monthMatch[2]);
      const year = parseInt(monthMatch[3]);

      if (!isNaN(day) && !isNaN(year) && monthIndex !== -1) {
        const eventDate = new Date(year, monthIndex, day);
        if (eventDate > new Date(currentYear, currentMonth, currentDay)) {
          return eventDate.toISOString();
        }
      }
    }
    return null;
  }
}

// Test the scraper (only when run directly)
if (import.meta.url === `file://${process.argv[1]}`) {
  async function testScraper() {
    const scraper = new SimpleRoxieScraper();
    const result = await scraper.scrape();
    console.log('🎯 Test Result:', JSON.stringify(result, null, 2));
  }
  
  console.log('🚀 Starting Roxie Theater test...');
  testScraper().catch(console.error);
}

export default SimpleRoxieScraper;
