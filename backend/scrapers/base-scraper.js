import puppeteer from 'puppeteer';

export class BaseScraper {
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-web-security'
        ]
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
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Starting ${this.name} scraper...`);
      
      // Initialize browser for BaseScraper-based scrapers
      await this.initBrowser();
      
      const events = await this.scrapeEvents();
      
      const duration = Date.now() - startTime;
      console.log(`✅ ${this.name} scraper completed: ${events.length} events found in ${duration}ms`);
      
      return {
        success: true,
        events: events,
        count: events.length,
        duration
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ ${this.name} scraper failed after ${duration}ms:`, error.message);
      
      return {
        success: false,
        events: [],
        count: 0,
        duration,
        error: error.message
      };
    } finally {
      // Always close browser, even if there was an error
      try {
        await this.closeBrowser();
        console.log(`🧹 ${this.name} browser closed successfully`);
      } catch (closeError) {
        console.error(`⚠️ ${this.name} failed to close browser:`, closeError.message);
        // Force browser cleanup
        this.browser = null;
      }
    }
  }

  // This method should be implemented by each scraper
  async scrapeEvents() {
    throw new Error('scrapeEvents() must be implemented by subclass');
  }

  // Helper method to get page content
  async getPageContent(url, customTimeout = 10000) {
    if (!this.browser) {
      console.log('🌐 Initializing browser...');
      this.browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }

    const page = await this.browser.newPage();
    
    try {
      console.log(`🌐 Loading page: ${url}`);
      
      // Set a reasonable timeout for page loading
      const timeout = Math.min(customTimeout, 30000); // Cap at 30 seconds max
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', // Don't wait for network idle - just DOM ready
        timeout: timeout 
      });
      
      // Minimal wait for content to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const content = await page.content();
      console.log(`✅ Page loaded successfully: ${content.length} characters`);
      
      return content;
      
    } catch (error) {
      console.error(`❌ Failed to load page ${url}: ${error.message}`);
      return null;
      
    } finally {
      await page.close(); // Always close the page to free up resources
    }
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

  // Helper method to extract text content
  extractText(element, selector) {
    try {
      const el = element.querySelector(selector);
      return el ? el.textContent.trim() : '';
    } catch (error) {
      return '';
    }
  }

  // Helper method to extract attribute
  extractAttribute(element, selector, attribute) {
    try {
      const el = element.querySelector(selector);
      return el ? el.getAttribute(attribute) : '';
    } catch (error) {
      return '';
    }
  }

  // Helper method to parse date strings
  parseDate(dateString) {
    if (!dateString) return null;
    
    try {
      // Try to parse common date formats
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      
      // Add more date parsing logic here if needed
      return null;
    } catch (error) {
      return null;
    }
  }

  // Helper method to clean text
  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }

  // 🎯 SMART DATA VALIDATION METHODS
  
  // Smart price extraction with validation
  extractPrice(element, selector) {
    const priceText = this.cleanText(this.extractText(element, selector));
    if (!priceText) return '';
    
    // Validate it's actually a price
    const pricePatterns = [
      /\$\d+(?:\.\d{2})?/g,           // $10, $10.50
      /free/gi,                        // Free
      /donation/gi,                    // Donation
      /pay.what.you.can/gi,            // Pay what you can
      /suggested/gi,                   // Suggested donation
      /tbd/gi,                         // TBD
      /varies/gi                       // Varies
    ];
    
    return pricePatterns.some(pattern => pattern.test(priceText)) ? priceText : '';
  }

  // Smart date extraction with validation
  extractDate(element, selector) {
    const dateText = this.cleanText(this.extractText(element, selector));
    if (!dateText) return null;
    
    // Validate it's actually a date
    const datePatterns = [
      /\d{1,2}\/\d{1,2}\/\d{4}/,      // MM/DD/YYYY
      /\d{1,2}-\d{1,2}-\d{4}/,        // MM-DD-YYYY
      /\w+ \d{1,2},? \d{4}/,          // Month DD, YYYY
      /\d{4}-\d{2}-\d{2}/,            // YYYY-MM-DD
      /today|tomorrow|tonight/gi,      // Relative dates
      /\d{1,2}:\d{2}\s*(?:am|pm)/gi   // Time patterns
    ];
    
    return datePatterns.some(pattern => pattern.test(dateText)) ? this.parseDate(dateText) : null;
  }

  // Smart title extraction with validation
  extractTitle(element, selector) {
    const titleText = this.cleanText(this.extractText(element, selector));
    if (!titleText) return '';
    
    // Filter out navigation and UI elements
    const blacklist = [
      'menu', 'navigation', 'footer', 'header', 'sidebar',
      'search', 'login', 'sign up', 'contact', 'about',
      'home', 'back', 'next', 'previous', 'close',
      'cookies', 'privacy policy', 'terms of service'
    ];
    
    const isBlacklisted = blacklist.some(word => 
      titleText.toLowerCase().includes(word.toLowerCase())
    );
    
    // Must be reasonable length and not blacklisted
    return (titleText.length >= 3 && titleText.length <= 200 && !isBlacklisted) ? titleText : '';
  }

  // Smart description extraction with validation
  extractDescription(element, selector) {
    const descText = this.cleanText(this.extractText(element, selector));
    if (!descText) return '';
    
    // Filter out very short or very long descriptions
    if (descText.length < 10 || descText.length > 500) return '';
    
    // Filter out navigation text
    const navPatterns = [
      /click here/i, /learn more/i, /read more/i,
      /buy tickets/i, /get directions/i, /view map/i
    ];
    
    const isNavigation = navPatterns.some(pattern => pattern.test(descText));
    return isNavigation ? '' : descText;
  }

  // 🎯 SCHEMA.ORG JSON-LD EXTRACTION
  
  // Extract structured data from JSON-LD scripts
  extractSchemaData(html) {
    try {
      const schemaMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs);
      if (!schemaMatches) return [];
      
      const events = [];
      schemaMatches.forEach(match => {
        try {
          const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
          const data = JSON.parse(jsonContent);
          
          if (data['@type'] === 'Event' || data['@type'] === 'MusicEvent') {
            events.push({
              title: data.name || '',
              description: data.description || '',
              date_start: data.startDate || data.startTime || '',
              location: data.location?.name || data.location?.address || '',
              source_url: data.url || '',
              image_url: data.image || '',
              price: data.offers?.price || data.price || ''
            });
          }
        } catch (parseError) {
          console.warn(`Failed to parse JSON-LD: ${parseError.message}`);
        }
      });
      
      return events;
    } catch (error) {
      console.warn(`Failed to extract schema data: ${error.message}`);
      return [];
    }
  }

  // 🎯 INTELLIGENT SELECTOR STRATEGY
  
  // Try multiple selector strategies in order of specificity
  extractWithFallback(element, selectors, extractor, validator) {
    for (const selector of selectors) {
      try {
        const result = extractor.call(this, element, selector);
        if (validator(result)) {
          return result;
        }
      } catch (error) {
        continue;
      }
    }
    return null;
  }

  // 🚨 COMPREHENSIVE EVENT VALIDATION - Only allow REAL events
  validateEventData(event) {
    // Must have required fields
    const required = ['title', 'date_start'];
    const hasRequired = required.every(field => event[field] && event[field].toString().length > 0);
    
    if (!hasRequired) {
      console.log(`❌ Event missing required fields: ${event.title}`);
      return false;
    }
    
    // 🚫 REJECT generic website elements (not events)
    const genericTitles = [
      'event spaces', 'get in touch', 'contact us', 'about us', 'privacy policy',
      'terms of service', 'cookies', 'accessibility', 'main navigation', 'breadcrumb',
      'footer', 'header', 'menu', 'search', 'login', 'sign up', 'newsletter',
      'donate', 'membership', 'volunteer', 'careers', 'jobs', 'press', 'media',
      'advertise', 'sponsor', 'partnership', 'affiliate', 'reseller', 'wholesale',
      'franchise', 'licensing', 'trademark', 'copyright', 'disclaimer', 'sitemap',
      'help', 'support', 'faq', 'contact sales', 'sales team', 'business',
      'corporate', 'enterprise', 'government', 'education', 'nonprofit',
      'private events', 'rentals', 'bookings', 'reservations', 'plan your event',
      'stay up to date', 'upcoming events', 'past events', 'calendar',
      'filter', 'sort', 'pagination', 'next page', 'previous page',
      'language switcher', 'content', 'tutorial', 'activity', 'workshop',
      'storytime', 'early learning', 'services', 'programs', 'resources'
    ];
    
    const titleLower = event.title.toLowerCase().trim();
    const isGeneric = genericTitles.some(generic => titleLower.includes(generic));
    
    if (isGeneric) {
      console.log(`❌ Rejected generic title: "${event.title}"`);
      return false;
    }
    
    // 🚫 REJECT navigation/UI elements
    const navPatterns = [
      /click here/i, /learn more/i, /read more/i, /buy tickets/i,
      /get directions/i, /view map/i, /book now/i, /reserve/i,
      /add to cart/i, /checkout/i, /payment/i, /shipping/i
    ];
    
    const isNavigation = navPatterns.some(pattern => pattern.test(event.title));
    if (isNavigation) {
      console.log(`❌ Rejected navigation element: "${event.title}"`);
      return false;
    }
    
    // 🚫 REJECT very short or very long titles
    if (event.title.length < 5 || event.title.length > 150) {
      console.log(`❌ Rejected title length: "${event.title}" (${event.title.length} chars)`);
      return false;
    }
    
    // 🚫 REJECT titles that are just punctuation or numbers
    if (/^[^\w\s]*$/.test(event.title) || /^\d+$/.test(event.title)) {
      console.log(`❌ Rejected non-text title: "${event.title}"`);
      return false;
    }
    
    // 🚫 REJECT titles that are just website sections
    if (/^(bayview|bernal heights|chinatown|dogpatch|eureka valley|excelsior|glen park|golden gate valley|ingleside|marina|merced|mission|mission bay|noe valley|north beach|ocean view|ortega|parkside|potrero|portola|presidio|richmond|sunset|treasure island|visitacion valley|west portal|western addition|virtual library|bookmobiles|mos|kiosk)$/i.test(titleLower)) {
      console.log(`❌ Rejected location section: "${event.title}"`);
      return false;
    }
    
    // ✅ VALIDATE date is actually a future date within 14 days
    if (event.date_start) {
      const eventDate = new Date(event.date_start);
      
      // Use Pacific Time for date calculations
      const now = new Date();
      const pacificTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
      
      if (isNaN(eventDate.getTime())) {
        console.log(`❌ Invalid date format: "${event.title}" - ${event.date_start}`);
        return false;
      }
      
      // Convert event date to Pacific Time for proper comparison
      const eventDatePacific = new Date(eventDate.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
      
      // Reject dates in the past (more than 1 day ago) - using Pacific Time
      const oneDayAgo = new Date(pacificTime.getTime() - (24 * 60 * 60 * 1000));
      if (eventDatePacific < oneDayAgo) {
        console.log(`❌ Past event rejected: "${event.title}" - ${event.date_start} (${eventDatePacific.toISOString()} Pacific Time)`);
        return false;
      }
      
      // 🎯 STRICT: Only allow events within 14 days from now - using Pacific Time
      const fourteenDaysFromNow = new Date(pacificTime.getTime() + (14 * 24 * 60 * 60 * 1000));
      if (eventDatePacific > fourteenDaysFromNow) {
        console.log(`❌ Event too far in future rejected: "${event.title}" - ${event.date_start} (${eventDatePacific.toISOString()} Pacific Time - beyond 14 days from ${pacificTime.toISOString().split('T')[0]} Pacific Time)`);
        return false;
      }
      
      // Log successful date validation
      console.log(`✅ Date validated: "${event.title}" - ${event.date_start} (${eventDatePacific.toISOString()} Pacific Time - within 14 days)`);
    }
    
      // ✅ Event passed all validation checks
  console.log(`✅ Valid event: "${event.title}"`);
  return true;
}

  // 🎯 EXTRACT THE 6 ESSENTIAL EVENT ELEMENTS
  extractEventElements(element) {
    return {
      // WHO - Artist/Performer name
      who: this.extractText(element, '.artist, .performer, .act, .comic, .musician, .speaker, .author, .host'),
      
      // WHAT - Event title/description  
      what: this.extractText(element, '.title, .event-title, .show-title, .name, h1, h2, h3, h4'),
      
      // WHEN - Date and time
      when: this.extractDate(element, '.date, .time, .event-date, .show-time, [datetime], .schedule'),
      
      // WHERE - Venue and location
      where: this.extractText(element, '.venue, .location, .place, .address, .city, .neighborhood'),
      
      // COST - Price/tickets
      cost: this.extractPrice(element, '.price, .cost, .ticket-price, .admission, .fee'),
      
      // IMAGE - Event poster/photo
      image: this.extractAttribute(element, 'img', 'src')
    };
  }

  // 🎯 SMART EVENT EXTRACTION - Only extract if it looks like a real event
  extractRealEvent(element) {
    const elements = this.extractEventElements(element);
    
    // Must have WHAT (title) and WHEN (date) to be considered an event
    if (!elements.what || !elements.when) {
      return null;
    }
    
    // Create event object with the 6 essential elements
    const event = {
      title: elements.what,
      description: elements.who ? `${elements.who} at ${this.config?.name || 'this venue'}` : `Event at ${this.config?.name || 'this venue'}`,
      date_start: elements.when,
      location: elements.where || this.config?.name || 'San Francisco',
      source: this.name,
      source_url: this.config?.url || '',
      category: this.config?.category || 'Other',
      price: elements.cost || 'TBD',
      image_url: elements.image || ''
    };
    
    // Only return if it passes strict validation
    return this.validateEventData(event) ? event : null;
  }
}

// BaseScraper is already exported via 'export class BaseScraper' above
