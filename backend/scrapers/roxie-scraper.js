import { BaseScraper } from './base-scraper.js';
import fetch from 'node-fetch';

export class RoxieScraper extends BaseScraper {
  constructor() {
    super('roxie', {
      url: 'https://roxie.com/upcoming_events',
      name: 'The Roxie Theater'
    });
  }

  async scrapeEvents() {
    try {
      console.log('🎬 Starting Roxie Theater scraper...');
      
      // Use simple fetch instead of Puppeteer for speed
      const response = await fetch(this.config.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 10000
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const rssContent = await response.text();
      console.log(`📡 RSS feed loaded: ${rssContent.length} characters`);
      
      const events = [];
      
      // Parse RSS content using regex (fast and simple)
      const itemMatches = rssContent.match(/<item>([\s\S]*?)<\/item>/gi);
      
      if (itemMatches) {
        console.log(`🔍 Found ${itemMatches.length} RSS items`);
        
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
            
            // Extract date from description (look for patterns like "August 22, 2025" or "Until August 30, 2025")
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
            
            // Only include future events
            const now = new Date();
            if (new Date(eventDate) <= now) {
              console.log(`⏭️ Skipping past event: "${title}" on ${eventDate}`);
              return;
            }
            
            console.log(`✅ Found event: "${title}" on ${eventDate}`);
            
            const event = {
              title: title,
              description: description || `Film screening at ${this.config.name}`,
              date_start: eventDate,
              location: `${this.config.name}, San Francisco`,
              source: this.config.name,
              source_url: filmUrl,
              category: 'Film',
              price: 'Varies',
              image_url: '',
              time_text: 'Check website for showtimes'
            };
            
            events.push(event);
            
          } catch (error) {
            console.warn(`⚠️ Error processing RSS item ${index}: ${error.message}`);
          }
        });
      }
      
      console.log(`✅ Roxie Theater scraper found ${events.length} events`);
      return events;
      
    } catch (error) {
      console.error('❌ Error scraping Roxie Theater:', error);
      return [];
    }
  }

  // Helper methods
  cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  }
  
  isGenericTitle(title) {
    if (!title) return true;
    const genericTitles = ['film', 'movie', 'screening', 'showing'];
    return genericTitles.some(generic => 
      title.toLowerCase().includes(generic)
    );
  }
  
  parseRoxieDate(dateText) {
    try {
      // Handle various date formats from Roxie
      const dateMatch = dateText.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/);
      if (!dateMatch) return null;
      
      const [, monthName, day, year] = dateMatch;
      const monthIndex = this.getMonthIndex(monthName);
      const eventDate = new Date(parseInt(year), monthIndex, parseInt(day));
      
      return eventDate.toISOString();
    } catch (error) {
      console.warn(`⚠️ Error parsing Roxie date "${dateText}":`, error.message);
      return null;
    }
  }
  
  getMonthIndex(monthName) {
    const months = {
      'january': 0, 'jan': 0,
      'february': 1, 'feb': 1,
      'march': 2, 'mar': 2,
      'april': 3, 'apr': 3,
      'may': 4,
      'june': 5, 'jun': 5,
      'july': 6, 'jul': 6,
      'august': 7, 'aug': 7,
      'september': 8, 'sep': 8, 'sept': 8,
      'october': 9, 'oct': 9,
      'november': 10, 'nov': 10,
      'december': 11, 'dec': 11
    };
    
    return months[monthName.toLowerCase()] || 0;
  }
}
