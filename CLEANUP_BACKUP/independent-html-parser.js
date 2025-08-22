#!/usr/bin/env node
// Independent HTML Parser - Extract events from actual HTML structure
// Focuses on the CSS selectors and patterns we discovered

class IndependentHTMLParser {
  constructor() {
    this.url = 'https://www.theindependentsf.com/';
    this.name = 'The Independent';
  }

  async scrape() {
    try {
      console.log('🚀 Starting Independent HTML Parser...');
      
      // Fetch the page content
      const html = await this.getPageContent(this.url);
      
      // Extract events using multiple HTML parsing strategies
      const events = await this.parseHTMLForEvents(html);
      
      // Filter to future events within 30 days
      const filteredEvents = this.filterFutureEvents(events);
      
      console.log(`✅ Found ${events.length} total events, ${filteredEvents.length} future events within 30 days`);
      return {
        success: true,
        events: filteredEvents,
        count: filteredEvents.length,
        duration: 0
      };
    } catch (error) {
      console.error('❌ Error parsing Independent HTML:', error);
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

  async parseHTMLForEvents(html) {
    const events = [];
    
    // 🎯 STRATEGY 1: Look for event containers with specific patterns
    console.log('🔍 Strategy 1: Looking for event containers...');
    const eventContainers = this.findEventContainers(html);
    console.log(`📊 Found ${eventContainers.length} potential event containers`);
    
    // 🎯 STRATEGY 2: Extract events from containers
    if (eventContainers.length > 0) {
      console.log('🔍 Strategy 2: Extracting events from containers...');
      const containerEvents = this.extractEventsFromContainers(eventContainers);
      events.push(...containerEvents);
    }
    
    // 🎯 STRATEGY 3: Look for date patterns and extract surrounding content
    if (events.length === 0) {
      console.log('🔍 Strategy 3: Looking for date patterns...');
      const dateEvents = this.extractEventsFromDatePatterns(html);
      events.push(...dateEvents);
    }
    
    // 🎯 STRATEGY 4: Look for ticket/event links
    if (events.length === 0) {
      console.log('🔍 Strategy 4: Looking for ticket/event links...');
      const linkEvents = this.extractEventsFromLinks(html);
      events.push(...linkEvents);
    }
    
    return events;
  }

  // 🎯 Find event containers in HTML
  findEventContainers(html) {
    const containers = [];
    
    // Look for common event container patterns
    const containerPatterns = [
      /<div[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      /<div[^>]*class="[^"]*show[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      /<div[^>]*class="[^"]*concert[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      /<article[^>]*>([\s\S]*?)<\/article>/gi,
      /<section[^>]*>([\s\S]*?)<\/section>/gi
    ];
    
    containerPatterns.forEach(pattern => {
      const matches = html.match(pattern);
      if (matches) {
        containers.push(...matches);
      }
    });
    
    return containers;
  }

  // 🎯 Extract events from HTML containers
  extractEventsFromContainers(containers) {
    const events = [];
    
    containers.forEach((container, index) => {
      try {
        // Extract text content (remove HTML tags)
        const textContent = container.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        
        // Look for event-like patterns in the text
        const eventPatterns = [
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:at|in|on)\s+(?:The Independent|Independent)/gi,
          /(?:Live|Concert|Show|Performance)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Tickets|Show|Concert)/gi
        ];
        
        eventPatterns.forEach(pattern => {
          const matches = textContent.match(pattern);
          if (matches) {
            matches.forEach(match => {
              // Try to find a date near this event title
              const eventDate = this.findDateNearText(container, match.trim());
              
              const event = {
                title: match.trim(),
                description: `Live music at ${this.name}`,
                date_start: eventDate,
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
      } catch (error) {
        console.warn(`⚠️ Error parsing container ${index}:`, error.message);
      }
    });
    
    return events;
  }

  // 🎯 Extract events from date patterns
  extractEventsFromDatePatterns(html) {
    const events = [];
    
    // Look for date patterns we found earlier
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})/g,  // MM/DD/YYYY
      /(\d{4}-\d{1,2}-\d{1,2})/g     // YYYY-MM-DD
    ];
    
    datePatterns.forEach(pattern => {
      const matches = html.match(pattern);
      if (matches) {
        matches.forEach(dateMatch => {
          // Look for text around the date that might be an event
          const dateIndex = html.indexOf(dateMatch);
          const beforeText = html.substring(Math.max(0, dateIndex - 200), dateIndex);
          const afterText = html.substring(dateIndex + dateMatch.length, dateIndex + 200);
          
          // Look for event-like text around the date
          const eventPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
          const beforeMatches = beforeText.match(eventPattern);
          const afterMatches = afterText.match(eventPattern);
          
          if (beforeMatches || afterMatches) {
            const eventTitle = (beforeMatches && beforeMatches[beforeMatches.length - 1]) || 
                              (afterMatches && afterMatches[0]) || 
                              'Live Music';
            
            const event = {
              title: eventTitle.trim(),
              description: `Live music at ${this.name}`,
              date_start: this.parseDate(dateMatch),
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
          }
        });
      }
    });
    
    return events;
  }

  // 🎯 Extract events from links
  extractEventsFromLinks(html) {
    const events = [];
    
    // Look for ticket/event links
    const linkPatterns = [
      /<a[^>]*href="[^"]*(?:ticket|event|show|concert)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi,
      /<a[^>]*class="[^"]*(?:ticket|event|show|concert)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi
    ];
    
    linkPatterns.forEach(pattern => {
      const matches = html.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const textContent = match.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          
          if (textContent.length > 3 && textContent.length < 100) {
            // Try to find a date near this event title
            const eventDate = this.findDateNearText(html, textContent);
            
            const event = {
              title: textContent,
              description: `Live music at ${this.name}`,
              date_start: eventDate,
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
          }
        });
      }
    });
    
    return events;
  }

  // 🎯 Find dates near specific text in HTML
  findDateNearText(html, eventTitle) {
    try {
      // Look for date patterns near the event title
      const datePatterns = [
        /(\d{1,2}\/\d{1,2}\/\d{4})/g,  // MM/DD/YYYY
        /(\d{4}-\d{1,2}-\d{1,2})/g,    // YYYY-MM-DD
        /(\w+ \d{1,2},? \d{4})/g,      // Month DD, YYYY (e.g., "August 18, 2025")
        /(\d{1,2}\/\d{1,2})/g           // MM/DD (assume current year)
      ];
      
      // Find the position of the event title in the HTML
      const titleIndex = html.indexOf(eventTitle);
      if (titleIndex === -1) return null;
      
      // Look for dates within 500 characters before or after the event title
      const searchStart = Math.max(0, titleIndex - 500);
      const searchEnd = Math.min(html.length, titleIndex + 500);
      const searchArea = html.substring(searchStart, searchEnd);
      
      // Try each date pattern
      for (const pattern of datePatterns) {
        const matches = searchArea.match(pattern);
        if (matches && matches.length > 0) {
          // Use the first date found near the event
          const dateString = matches[0];
          const parsedDate = this.parseDate(dateString);
          
          // If it's a valid future date, return it
          if (parsedDate && !isNaN(new Date(parsedDate).getTime())) {
            console.log(`📅 Found date "${dateString}" near event "${eventTitle}" -> ${parsedDate}`);
            return parsedDate;
          }
        }
      }
      
      // If no valid date found, return null instead of today's date
      console.log(`⚠️ No valid date found near event "${eventTitle}"`);
      return null;
      
    } catch (error) {
      console.warn(`⚠️ Error finding date for event "${eventTitle}":`, error.message);
      return null;
    }
  }

  // 🎯 Parse date strings
  parseDate(dateString) {
    try {
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 2) {
          // MM/DD format (assume current year 2025)
          const [month, day] = parts;
          const parsedDate = new Date(2025, parseInt(month) - 1, parseInt(day));
          console.log(`📅 Parsed "${dateString}" (MM/DD) to ${parsedDate.toISOString()}`);
          return parsedDate.toISOString();
        } else if (parts.length === 3) {
          // MM/DD/YYYY format (e.g., "3/27/2025")
          const [month, day, year] = parts;
          const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          console.log(`📅 Parsed "${dateString}" (MM/DD/YYYY) to ${parsedDate.toISOString()}`);
          return parsedDate.toISOString();
        }
      } else if (dateString.includes('-')) {
        // YYYY-MM-DD format (e.g., "2025-04-24")
        const parsedDate = new Date(dateString);
        console.log(`📅 Parsed "${dateString}" (YYYY-MM-DD) to ${parsedDate.toISOString()}`);
        return parsedDate.toISOString();
      } else if (dateString.match(/^\w+ \d{1,2},? \d{4}$/)) {
        // Month DD, YYYY format (e.g., "August 18, 2025")
        const parsedDate = new Date(dateString);
        console.log(`📅 Parsed "${dateString}" (Month DD, YYYY) to ${parsedDate.toISOString()}`);
        return parsedDate.toISOString();
      }
    } catch (error) {
      console.warn(`⚠️ Failed to parse date: ${dateString}`);
    }
    
    // Return null instead of today's date if parsing fails
    return null;
  }

  // Validate extracted event data
  validateEventData(event) {
    const required = ['title'];
    const hasRequired = required.every(field => event[field] && event[field].toString().length > 0);
    
    if (!hasRequired) return false;
    
    // Title should be reasonable length
    if (event.title.length < 3 || event.title.length > 200) return false;
    
    // Date is optional now (can be null), but if present should be valid
    if (event.date_start && isNaN(new Date(event.date_start).getTime())) return false;
    
    return true;
  }

  // 🎯 FILTER: Only future events within 30 days
  filterFutureEvents(events) {
    // Since we're in August 2025, let's look for events from now through September
    const now = new Date('2025-08-18'); // Today's date
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    console.log(`🔍 Filtering events from ${now.toISOString()} to ${thirtyDaysFromNow.toISOString()}`);
    
    return events.filter(event => {
      if (!event.date_start) return false;
      
      const eventDate = new Date(event.date_start);
      const isFuture = eventDate >= now; // Include today
      const isWithin30Days = eventDate <= thirtyDaysFromNow;
      
      if (isFuture && isWithin30Days) {
        console.log(`✅ Event "${event.title}" on ${event.date_start} is within range`);
      } else {
        console.log(`❌ Event "${event.title}" on ${event.date_start} is outside range (future: ${isFuture}, within30: ${isWithin30Days})`);
      }
      
      return isFuture && isWithin30Days;
    });
  }
}

// Test the parser (only when run directly)
if (import.meta.url === `file://${process.argv[1]}`) {
  async function testParser() {
    const parser = new IndependentHTMLParser();
    const result = await parser.scrape();
    console.log('🎯 Test Result:', JSON.stringify(result, null, 2));
  }
  
  console.log('🚀 Starting Independent HTML Parser test...');
  testParser().catch(console.error);
}

export default IndependentHTMLParser;
