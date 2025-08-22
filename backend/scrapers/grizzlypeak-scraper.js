import { BaseScraper } from './base-scraper.js';
import * as cheerio from 'cheerio';

export class GrizzlyPeakScraper extends BaseScraper {
  constructor() {
    super('grizzlypeak', {
      url: 'https://www.grizz.org/rides/',
      name: 'Grizzly Peak Cyclists'
    });
  }

  async scrapeEvents() {
    try {
      console.log('🚴‍♂️ Starting Grizzly Peak Cyclists scraper...');
      const html = await this.getPageContent(this.config.url);
      const $ = cheerio.load(html);
      const events = [];

      console.log(`🔍 HTML content length: ${html.length} characters`);
      
      // Look for ride listings in div.rideListing elements
      const rideListings = $('.rideListing');
      console.log(`🔍 Found ${rideListings.length} .rideListing elements`);
      
      rideListings.each((i, element) => {
        try {
          const $element = $(element);
          console.log(`🔍 Processing ride listing ${i}:`, $element.text().substring(0, 100));
          
          // Extract date from the <b> tag (e.g., "THU AUG 21")
          const $dateElement = $element.find('b').first();
          if (!$dateElement.length) {
            console.log(`⚠️ No date element found in ride ${i}`);
            return;
          }
          
          const dateText = $dateElement.text().trim();
          console.log(`🔍 Date text: "${dateText}"`);
          
          if (!dateText || dateText === 'Today') {
            console.log(`⚠️ Skipping date: "${dateText}"`);
            return;
          }
          
          const rideDate = this.parseGrizzDate(dateText);
          if (!rideDate) {
            console.log(`⚠️ Could not parse date: "${dateText}"`);
            return;
          }
          
          console.log(`✅ Parsed date: ${rideDate.toISOString()}`);
          
          // Extract ride name from the <i> tag
          const $rideNameElement = $element.find('i');
          if (!$rideNameElement.length) {
            console.log(`⚠️ No ride name element found in ride ${i}`);
            return;
          }
          
          const rideName = $rideNameElement.text().trim();
          if (!rideName) {
            console.log(`⚠️ Empty ride name in ride ${i}`);
            return;
          }
          
          console.log(`✅ Ride name: "${rideName}"`);
          
          // Extract leader information
          const leaderText = $element.text();
          const leaderMatch = leaderText.match(/Leader:\s*([^&\n]+)/);
          const leader = leaderMatch ? leaderMatch[1].trim() : 'Grizzly Peak Cyclists';
          
          // Extract meet time - FIXED: Better time extraction
          let meetTime = '';
          const timeMatch = leaderText.match(/Meet at\s+(\d{1,2}:\d{2}\s*[ap]m)/i);
          if (timeMatch) {
            meetTime = timeMatch[1];
          } else {
            // Look for other time patterns
            const otherTimeMatch = leaderText.match(/(\d{1,2}:\d{2}\s*[ap]m)/i);
            if (otherTimeMatch) {
              meetTime = otherTimeMatch[1];
            } else {
              // Look for time in the date text (e.g., "9:00 am")
              const dateTimeMatch = dateText.match(/(\d{1,2}:\d{2}\s*[ap]m)/i);
              if (dateTimeMatch) {
                meetTime = dateTimeMatch[1];
              }
            }
          }
          
          // Extract start location
          const locationMatch = leaderText.match(/Start Location:\s*([^\n]+)/);
          const startLocation = locationMatch ? locationMatch[1].trim() : 'Various Bay Area locations';
          
          // Extract route description
          const routeMatch = leaderText.match(/GPC Route:\s*([^\n]+)/);
          const routeDescription = routeMatch ? routeMatch[1].trim() : '';
          
          // Extract rating (e.g., "3/TM,M/62")
          const ratingMatch = dateText.match(/\d+\/[A-Z,]+(\/\d+)?/);
          const rating = ratingMatch ? ratingMatch[0] : '';
          
          // Create event object
          const event = {
            title: rideName,
            description: `${rideName} - ${routeDescription || 'Cycling ride with Grizzly Peak Cyclists'}${rating ? ` (${rating})` : ''}`,
            date_start: rideDate.toISOString(),
            location: startLocation,
            source: this.config.name,
            source_url: this.config.url,
            category: 'Cycling',
            price: 'Free',
            host: leader,
            image_url: '',
            time_text: meetTime || 'Check ride details'
          };
          
          events.push(event);
          console.log(`🚴‍♂️ Found Grizzly Peak ride: ${rideName} on ${rideDate.toISOString()}`);
        } catch (error) {
          console.warn(`⚠️ Error processing Grizzly Peak ride ${i}:`, error.message);
        }
      });

      console.log(`✅ Grizzly Peak Cyclists scraper found ${events.length} rides`);
      return events;
    } catch (error) {
      console.error('Error scraping Grizzly Peak events:', error);
      throw error;
    }
  }

  parseGrizzDate(dateText) {
    try {
      // Format: "SAT AUG 23 2/LT/35" or "MON SEP 1 3!/T/16"
      // Extract just the date part before the difficulty/type/distance info
      const match = dateText.match(/^([A-Z]{3})\s+([A-Z]{3})\s+(\d{1,2})\s+/);
      if (!match) return null;
      
      const [, dayOfWeek, month, day] = match;
      
      const monthMap = {
        'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
        'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
      };
      
      const monthIndex = monthMap[month];
      if (monthIndex === undefined) return null;
      
      // Assume current year for now
      const currentYear = new Date().getFullYear();
      const rideDate = new Date(currentYear, monthIndex, parseInt(day));
      
      // If the date is in the past, it might be next year
      if (rideDate < new Date()) {
        rideDate.setFullYear(currentYear + 1);
      }
      
      // Only include future rides
      const now = new Date();
      if (rideDate < now) return null;
      
      return rideDate;
    } catch (error) {
      console.warn(`⚠️ Error parsing Grizz date "${dateText}":`, error.message);
      return null;
    }
  }
}
