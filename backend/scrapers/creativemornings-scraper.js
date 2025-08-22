import { BaseScraper } from './base-scraper.js';
import * as cheerio from 'cheerio';

export class CreativeMorningsScraper extends BaseScraper {
  constructor() {
    super('creativemornings', {
      url: 'https://creativemornings.com/fieldtrips/browse',
      name: 'CreativeMornings FieldTrips'
    });
    
    // TEMPORARY: Force the FieldTrips URL regardless of database config
    this.config.url = 'https://creativemornings.com/fieldtrips/browse';
    console.log('🎨 CreativeMornings scraper forced to use FieldTrips URL:', this.config.url);
  }

  async scrapeEvents() {
    try {
      console.log('🎨 Scraping Creative Mornings FieldTrips...');
      const html = await this.getPageContent(this.config.url);
      const $ = cheerio.load(html);
      const events = [];

      // Target the specific FieldTrips structure: .cm-card.event-card.event-card--fieldtrip
      $('.cm-card.event-card.event-card--fieldtrip').each((i, element) => {
        try {
          const $element = $(element);
          
          // Extract event title from h3.event-card__title
          const title = this.cleanText(
            $element.find('.event-card__title').text().trim()
          );

          // Extract date from datetime attribute in .event-card__datetime
          const dateTime = $element.find('.event-card__datetime time').attr('datetime');
          
          // Extract category from icon alt text
          const category = this.cleanText(
            $element.find('.event-card__icon img').attr('alt') || 'Creative Workshop'
          );

          // Extract event URL
          const eventUrl = $element.attr('href');
          const fullEventUrl = eventUrl ? `https://creativemornings.com${eventUrl}` : this.config.url;

          // Extract time from the time element
          const timeText = this.cleanText(
            $element.find('.event-card__time').text().trim()
          );

          // Extract description from title if no explicit description
          const description = `${title} - CreativeMornings FieldTrip`;

          if (title && title.length > 3) {
            const event = {
              title: title.trim(),
              description: description.trim(),
              date_start: this.parseDateTime(dateTime),
              location: 'Virtual (CreativeMornings FieldTrip)',
              source: 'creativemornings',
              source_url: fullEventUrl,
              category: category.trim(),
              price: 'Free',
              host: 'CreativeMornings',
              image_url: $element.find('.event-card__icon img').attr('src') || '',
              time_text: timeText
            };

            // Only add events with valid titles
            if (event.title && event.title !== 'undefined' && event.title.length > 3) {
              events.push(event);
              console.log(`🎯 Found FieldTrip: ${event.title} on ${event.date_start}`);
            }
          }
        } catch (error) {
          console.warn(`⚠️ Error parsing CreativeMornings FieldTrip ${i}:`, error.message);
        }
      });

      // If no events found with the main selector, try alternative approach
      if (events.length === 0) {
        console.log('🔍 No events found with main selector, trying alternative approach...');
        
        // Look for any text that looks like an event title
        $('h1, h2, h3, h4, h5, h6, .title, [class*="title"]').each((i, element) => {
          const text = this.cleanText($(element).text());
          if (text && text.length > 5 && text.length < 100 && 
              !text.includes('CreativeMornings') && !text.includes('FieldTrip')) {
            
            const event = {
              title: text,
              description: 'CreativeMornings FieldTrip event',
              date_start: null,
              location: 'Virtual (CreativeMornings FieldTrip)',
              source: 'creativemornings',
              source_url: this.config.url,
              category: 'Creative Workshop',
              price: 'Free',
              host: 'CreativeMornings',
              image_url: ''
            };
            
            events.push(event);
            console.log(`🎯 Found alternative event: ${event.title}`);
          }
        });
      }

      console.log(`✅ CreativeMornings FieldTrips scraper found ${events.length} events`);
      return events;

    } catch (error) {
      console.error('❌ Error scraping CreativeMornings FieldTrips events:', error);
      throw error;
    }
  }

  // Enhanced date parsing for CreativeMornings FieldTrips datetime attribute
  parseDateTime(dateTimeString) {
    if (!dateTimeString) return null;
    
    try {
      // Parse ISO datetime string like "2025-08-19T19:00:00Z"
      const date = new Date(dateTimeString);
      
      if (isNaN(date.getTime())) {
        console.warn(`⚠️ Invalid datetime: ${dateTimeString}`);
        return null;
      }
      
      return date.toISOString();
      
    } catch (error) {
      console.warn(`⚠️ Could not parse datetime: ${dateTimeString}`, error.message);
      return null;
    }
  }

  // Enhanced date parsing for CreativeMornings format (fallback)
  parseDate(dateText) {
    if (!dateText) return null;
    
    try {
      // Handle CreativeMornings format: "Tue, Aug 19 • 3:00 PM – 4:00 PM EDT"
      const dateMatch = dateText.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d+)/);
      
      if (dateMatch) {
        const [, dayOfWeek, month, day] = dateMatch;
        const monthMap = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        
        const currentYear = new Date().getFullYear();
        const monthIndex = monthMap[month];
        const dayNum = parseInt(day);
        
        // Create date object - assume current year unless it's past August and we're in early year
        let year = currentYear;
        if (monthIndex < 7 && new Date().getMonth() > 7) {
          year = currentYear + 1; // Next year for early months
        }
        
        const eventDate = new Date(year, monthIndex, dayNum);
        
        // Extract time if available
        const timeMatch = dateText.match(/(\d+):(\d+)\s+([AP]M)/);
        if (timeMatch) {
          let [_, hours, minutes, period] = timeMatch;
          let hour = parseInt(hours);
          
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
          
          eventDate.setHours(hour, parseInt(minutes), 0, 0);
        }
        
        return eventDate.toISOString();
      }
      
      // Fallback to base class date parsing
      return super.parseDate ? super.parseDate(dateText) : null;
      
    } catch (error) {
      console.warn(`⚠️ Could not parse date: ${dateText}`, error.message);
      return null;
    }
  }
}
