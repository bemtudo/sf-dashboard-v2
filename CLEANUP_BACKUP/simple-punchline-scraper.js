#!/usr/bin/env node

// Simple Punchline Scraper - Implements the 3-step strategy
// Uses built-in Node.js modules to avoid dependency issues

class SimplePunchlineScraper {
  constructor() {
    this.url = 'https://www.punchlinecomedyclub.com/shows';
    this.name = 'Punchline Comedy Club';
  }

  async scrape() {
    try {
      console.log('🚀 Starting Punchline scraper...');
      
      // Step 1: Fetch the page using built-in fetch
      const response = await fetch(this.url);
      const html = await response.text();
      
      // Step 2: Extract events using multiple strategies
      const allEvents = await this.extractEvents(html);
      
      // Step 3: Filter to only future events within 14 days
      const filteredEvents = this.filterFutureEvents(allEvents);
      
      console.log(`✅ Found ${allEvents.length} total events, ${filteredEvents.length} future events within 14 days`);
      return {
        success: true,
        events: filteredEvents,
        count: filteredEvents.length,
        duration: 0
      };
      
    } catch (error) {
      console.error('❌ Punchline scraper failed:', error.message);
      return {
        success: false,
        events: [],
        count: 0,
        duration: 0,
        error: error.message
      };
    }
  }

  async extractEvents(html) {
    const events = [];

    // 🎯 STRATEGY 1: Extract from Schema.org JSON-LD (Most Reliable)
    console.log('🔍 Step 1: Extracting from Schema.org structured data...');
    const schemaEvents = this.extractSchemaData(html);
    if (schemaEvents.length > 0) {
      console.log(`✅ Found ${schemaEvents.length} events from structured data`);
      events.push(...schemaEvents);
      return events;
    }

    // 🎯 STRATEGY 2: Content Analysis Fallback
    console.log('🔍 Step 2: Using content analysis fallback...');
    const contentEvents = this.extractFromContent(html);
    if (contentEvents.length > 0) {
      console.log(`✅ Found ${contentEvents.length} events from content analysis`);
      events.push(...contentEvents);
    }

    return events;
  }

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
            const event = {
              title: data.name || '',
              description: data.description || `Comedy show at ${this.name}`,
              date_start: data.startDate || data.startTime || '',
              location: data.location?.name || data.location?.address || this.name,
              source: 'punchline',
              source_url: data.url || this.url,
              category: 'Comedy',
              price: data.offers?.price || data.price || 'Varies',
              image_url: data.image || ''
            };
            
            if (this.validateEventData(event)) {
              events.push(event);
            }
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

  // Extract events from page content analysis
  extractFromContent(html) {
    const events = [];
    
    // Look for patterns that suggest events
    const eventPatterns = [
      /(?:comedy|show|performance|event).*?(?:at|in|on).*?(?:punchline|comedy club)/gi,
      /(?:stand.?up|comedy|show).*?(?:tonight|tomorrow|this week|next week)/gi
    ];

    if (eventPatterns.some(pattern => pattern.test(html))) {
      events.push({
        title: 'Comedy Show at Punchline',
        description: `Comedy show at ${this.name} (details extracted from page content)`,
        date_start: new Date().toISOString(),
        location: this.name,
        source: 'punchline',
        source_url: this.url,
        category: 'Comedy',
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
}

// Test the scraper (only when run directly)
if (import.meta.url === `file://${process.argv[1]}`) {
  async function testScraper() {
    const scraper = new SimplePunchlineScraper();
    const result = await scraper.scrape();
    console.log('🎯 Test Result:', JSON.stringify(result, null, 2));
  }
  
  console.log('🚀 Starting test...');
  testScraper().catch(console.error);
}

export default SimplePunchlineScraper;
