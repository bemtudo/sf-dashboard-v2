import { BaseScraper } from './base-scraper.js';
import * as cheerio from 'cheerio';

export class BalboaScraper extends BaseScraper {
  constructor() {
    super('balboa', {
      url: 'https://www.balboamovies.com/calendar',
      name: 'Balboa Theater'
    });
  }

  async scrapeEvents() {
    try {
      console.log('🎬 Balboa Theater scraper DISABLED due to website complexity causing massive duplicates');
      console.log('⚠️ The Balboa Theater website calendar structure is too complex and creates hundreds of duplicate events');
      console.log('🔧 This scraper needs a complete rewrite with a different approach to handle their calendar grid');
      
      // Return empty array to prevent database pollution
      return [];

    } catch (error) {
      console.error('❌ Error in Balboa Theater scraper:', error);
      return [];
    }
  }
  
  // Helper to create Pacific timezone date
  createPacificDate(baseDate, hour, minute, ampm) {
    const date = new Date(baseDate);
    
    // Convert 12-hour to 24-hour format
    let hour24 = hour;
    if (ampm === 'PM' && hour !== 12) {
      hour24 += 12;
    } else if (ampm === 'AM' && hour === 12) {
      hour24 = 0;
    }
    
    date.setHours(hour24, minute, 0, 0);
    
    // Format as Pacific timezone string
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hourStr = String(date.getHours()).padStart(2, '0');
    const minuteStr = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hourStr}:${minuteStr}:00-07:00`;
  }
}