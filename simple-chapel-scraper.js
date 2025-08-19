#!/usr/bin/env node
// Simple Chapel Scraper - Implements the 3-step strategy
// Uses built-in Node.js modules to avoid dependency issues

class SimpleChapelScraper {
  constructor() {
    this.url = 'https://thechapelsf.com/music/';
    this.name = 'The Chapel';
  }

  async scrape() {
    try {
      console.log('🚀 Starting Chapel scraper...');
      
      // Step 1: Fetch the page content
      const html = await this.getPageContent(this.url);
      
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
      console.error('❌ Error scraping Chapel:', error);
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

  async extractEvents(html) {
    const events = [];
    
    // 🎯 STRATEGY 1: Extract from Schema.org JSON-LD (Most Reliable)
    console.log('🔍 Step 1: Extracting from Schema.org structured data...');
    const schemaEvents = this.extractSchemaData(html);
    if (schemaEvents.length > 0) {
      console.log(`✅ Found ${schemaEvents.length} events from structured data`);
      events.push(...schemaEvents);
    }
    
    // 🎯 STRATEGY 2: Content Analysis Fallback (If no structured data)
    if (events.length === 0) {
      console.log('🔍 Step 2: Using content analysis fallback...');
      const contentEvents = this.extractFromContent(html);
      events.push(...contentEvents);
    }
    
    return events;
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
            if (item['@type'] === 'Event' || item['@type'] === 'MusicEvent' || item['@type'] === 'Concert') {
              const event = {
                title: item.name || item.title || 'Live Music',
                description: item.description || `Live music at ${this.name}`,
                date_start: item.startDate || item.datePublished || item.dateCreated,
                location: item.location?.name || item.location || `${this.name}, San Francisco`,
                source: 'chapel',
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

  // 🎯 CONTENT ANALYSIS FALLBACK
  extractFromContent(html) {
    const events = [];
    
    // Look for music-related content patterns
    const musicPatterns = [
      /(?:live music|concert|show|performance).*?(?:at|in|on).*?(?:chapel)/gi,
      /(?:tonight|tomorrow|this week|next week).*?(?:music|concert|show)/gi
    ];
    
    // This is a basic fallback - in practice you'd want more sophisticated analysis
    if (musicPatterns.some(pattern => pattern.test(html))) {
      // Create a basic event based on content analysis
      events.push({
        title: 'Live Music at The Chapel',
        description: 'Live music performance at The Chapel (details extracted from page content)',
        date_start: new Date().toISOString(), // Default to today
        location: 'The Chapel, San Francisco',
        source: 'chapel',
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

// Test the scraper
async function testScraper() {
  const scraper = new SimpleChapelScraper();
  const result = await scraper.scrape();
  console.log('🎯 Test Result:', JSON.stringify(result, null, 2));
}

// Run test directly
console.log('🚀 Starting Chapel test...');
testScraper().catch(console.error);

export default SimpleChapelScraper;
