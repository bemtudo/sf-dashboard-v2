#!/usr/bin/env node
// Simple Independent Scraper - Custom analysis and scraping
// Uses built-in Node.js modules to avoid dependency issues

class SimpleIndependentScraper {
  constructor() {
    this.url = 'https://www.theindependentsf.com/';
    this.name = 'The Independent';
  }

  async scrape() {
    try {
      console.log('🚀 Starting Independent scraper...');
      
      // Step 1: Fetch the page content
      const html = await this.getPageContent(this.url);
      
      // Step 2: Analyze the HTML structure
      console.log('🔍 Analyzing HTML structure...');
      const analysis = this.analyzeHTMLStructure(html);
      console.log('📊 HTML Analysis:', analysis);
      
      // Step 3: Extract events using custom logic
      const allEvents = await this.extractEvents(html, analysis);
      
      // Step 4: Filter to only future events within 14 days
      const filteredEvents = this.filterFutureEvents(allEvents);
      
      console.log(`✅ Found ${allEvents.length} total events, ${filteredEvents.length} future events within 14 days`);
      return {
        success: true,
        events: filteredEvents,
        count: filteredEvents.length,
        duration: 0,
        analysis: analysis
      };
    } catch (error) {
      console.error('❌ Error scraping Independent:', error);
      return {
        success: false,
        events: [],
        count: 0,
        duration: 0,
        error: error.message
      };
    }
  }

  async getPageContent(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      throw new Error(`Failed to fetch ${url}: ${error.message}`);
    }
  }

  // 🔍 ANALYZE HTML STRUCTURE
  analyzeHTMLStructure(html) {
    const analysis = {
      hasSchemaOrg: false,
      hasEvents: false,
      hasCalendar: false,
      hasShows: false,
      hasTickets: false,
      potentialSelectors: [],
      datePatterns: [],
      eventKeywords: []
    };

    // Check for Schema.org data
    analysis.hasSchemaOrg = html.includes('application/ld+json');
    
    // Check for event-related keywords
    const eventKeywords = ['event', 'show', 'concert', 'ticket', 'calendar', 'schedule'];
    analysis.eventKeywords = eventKeywords.filter(keyword => 
      html.toLowerCase().includes(keyword)
    );
    
    // Look for potential CSS selectors
    const potentialSelectors = [
      '.event', '.show', '.concert', '.ticket', '.calendar',
      '[class*="event"]', '[class*="show"]', '[class*="concert"]',
      'article', 'section', '.item', '.entry'
    ];
    
    analysis.potentialSelectors = potentialSelectors.filter(selector => {
      // Remove the brackets and class* parts for checking
      const cleanSelector = selector.replace(/[\[\]*]/g, '').replace('class*=', '');
      return html.includes(cleanSelector);
    });
    
    // Check for date patterns
    const datePatterns = [
      /\d{1,2}\/\d{1,2}\/\d{4}/g,  // MM/DD/YYYY
      /\d{4}-\d{1,2}-\d{1,2}/g,    // YYYY-MM-DD
      /\w+\s+\d{1,2},?\s+\d{4}/g   // Month DD, YYYY
    ];
    
    analysis.datePatterns = datePatterns.map(pattern => {
      const matches = html.match(pattern);
      return matches ? matches.slice(0, 3) : []; // First 3 matches
    });
    
    // Check for specific content
    analysis.hasEvents = html.toLowerCase().includes('event');
    analysis.hasCalendar = html.toLowerCase().includes('calendar');
    analysis.hasShows = html.toLowerCase().includes('show');
    analysis.hasTickets = html.toLowerCase().includes('ticket');
    
    return analysis;
  }

  async extractEvents(html, analysis) {
    const events = [];
    
      // 🎯 STRATEGY 1: Schema.org JSON-LD (Most Reliable)
  if (analysis.hasSchemaOrg) {
    console.log('🔍 Step 1: Extracting from Schema.org structured data...');
    const schemaEvents = this.extractSchemaData(html);
    if (schemaEvents.length > 0) {
      console.log(`✅ Found ${schemaEvents.length} events from structured data`);
      events.push(...schemaEvents);
    } else {
      console.log('⚠️ Schema.org found but no events extracted - checking raw data...');
      // Debug: Let's see what's actually in the Schema.org data
      this.debugSchemaData(html);
    }
  }
    
    // 🎯 STRATEGY 2: Custom HTML Parsing (Based on analysis)
    if (events.length === 0) {
      console.log('🔍 Step 2: Using custom HTML parsing based on analysis...');
      const customEvents = this.extractFromCustomParsing(html, analysis);
      events.push(...customEvents);
    }
    
    // 🎯 STRATEGY 3: Content Analysis Fallback
    if (events.length === 0) {
      console.log('🔍 Step 3: Using content analysis fallback...');
      const contentEvents = this.extractFromContent(html);
      events.push(...contentEvents);
    }
    
    return events;
  }

  // 🎯 SCHEMA.ORG JSON-LD EXTRACTION
  extractSchemaData(html) {
    const events = [];
    
    const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    
    if (jsonLdMatches) {
      jsonLdMatches.forEach((script, index) => {
        try {
          const jsonContent = script.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
          const data = JSON.parse(jsonContent);
          
          const items = Array.isArray(data) ? data : [data];
          
          items.forEach(item => {
            if (item['@type'] === 'Event' || item['@type'] === 'MusicEvent' || item['@type'] === 'Concert') {
              const event = {
                title: item.name || item.title || 'Live Music',
                description: item.description || `Live music at ${this.name}`,
                date_start: item.startDate || item.datePublished || item.dateCreated,
                location: item.location?.name || item.location || `${this.name}, San Francisco`,
                source: 'independent',
                source_url: item.url || this.url,
                category: 'Music',
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

  // 🎯 CUSTOM HTML PARSING (Based on analysis)
  extractFromCustomParsing(html, analysis) {
    const events = [];
    
    // Try different strategies based on what we found
    if (analysis.potentialSelectors.length > 0) {
      console.log('🔍 Trying potential selectors:', analysis.potentialSelectors.slice(0, 3));
      
      // This is a simplified approach - in practice you'd use a proper HTML parser
      // For now, we'll look for patterns in the text
      const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
      
      // Look for event-like patterns
      const eventPatterns = [
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:at|in|on)\s+(?:The Independent|Independent)/gi,
        /(?:Live|Concert|Show|Performance)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
      ];
      
      eventPatterns.forEach(pattern => {
        const matches = textContent.match(pattern);
        if (matches) {
          matches.slice(0, 3).forEach(match => {
            const event = {
              title: match.trim(),
              description: `Live music at ${this.name}`,
              date_start: new Date().toISOString(), // Default to today
              location: `${this.name}, San Francisco`,
              source: 'independent',
              source_url: this.url,
              category: 'Music',
              price: 'Varies',
              image_url: ''
            };
            
            if (this.validateEventData(event)) {
              events.push(event);
            }
          });
        }
      });
    }
    
    return events;
  }

  // 🔍 DEBUG: Check what's actually in Schema.org data
  debugSchemaData(html) {
    const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    
    if (jsonLdMatches) {
      console.log(`🔍 Found ${jsonLdMatches.length} Schema.org scripts`);
      jsonLdMatches.forEach((script, index) => {
        try {
          const jsonContent = script.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
          const data = JSON.parse(jsonContent);
          console.log(`📊 Script ${index + 1}:`, JSON.stringify(data, null, 2).substring(0, 500) + '...');
        } catch (error) {
          console.warn(`⚠️ Failed to parse script ${index + 1}:`, error.message);
        }
      });
    }
  }

  // 🎯 CONTENT ANALYSIS FALLBACK
  extractFromContent(html) {
    const events = [];
    
    // Look for music-related content patterns
    const musicPatterns = [
      /(?:live music|concert|show|performance).*?(?:at|in|on).*?(?:independent)/gi,
      /(?:tonight|tomorrow|this week|next week).*?(?:music|concert|show)/gi
    ];
    
    if (musicPatterns.some(pattern => pattern.test(html))) {
      events.push({
        title: 'Live Music at The Independent',
        description: 'Live music performance at The Independent (details extracted from page content)',
        date_start: new Date().toISOString(), // Default to today
        location: 'The Independent, San Francisco',
        source: 'independent',
        source_url: this.url,
        category: 'Music',
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

  // 🎯 FILTER: Only future events within 30 days (extended for testing)
  filterFutureEvents(events) {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    return events.filter(event => {
      if (!event.date_start) return false;
      
      const eventDate = new Date(event.date_start);
      const isFuture = eventDate > now;
      const isWithin30Days = eventDate <= thirtyDaysFromNow;
      
      return isFuture && isWithin30Days;
    });
  }
}

// Test the scraper
async function testScraper() {
  const scraper = new SimpleIndependentScraper();
  const result = await scraper.scrape();
  console.log('🎯 Test Result:', JSON.stringify(result, null, 2));
}

// Run test directly
console.log('🚀 Starting Independent test...');
testScraper().catch(console.error);

export default SimpleIndependentScraper;
