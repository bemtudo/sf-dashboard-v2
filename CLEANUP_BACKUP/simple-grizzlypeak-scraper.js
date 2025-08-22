#!/usr/bin/env node
// Simple Grizzly Peak Cyclists Scraper - Standalone cycling events scraper

import puppeteer from 'puppeteer';

class SimpleGrizzlyPeakScraper {
  constructor() {
    this.url = 'https://www.grizz.org/rides/';
    this.name = 'Grizzly Peak Cyclists';
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
      console.log('🚴‍♂️ Starting Grizzly Peak Cyclists scraper...');
      
      const events = await this.scrapeEvents();
      
      console.log(`✅ Found ${events.length} cycling events`);
      
      return {
        success: true,
        events: events,
        count: events.length,
        duration: 0
      };
    } catch (error) {
      console.error('❌ Error scraping Grizzly Peak Cyclists:', error);
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
      
      console.log(`⏳ Waiting for content to load...`);
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Get page content
      const content = await page.content();
      console.log(`📄 Page loaded, content length: ${content.length} characters`);
      
      await page.close();
      return content;
      
    } catch (error) {
      throw new Error(`Failed to fetch ${url}: ${error.message}`);
    }
  }

  async scrapeEvents() {
    try {
      const pageContent = await this.getPageContent(this.url);
      if (!pageContent) return [];
      
      const events = [];
      
      // Look for ride listings - Grizzly Peak has structured ride divs
      const rideListingMatches = pageContent.match(/<div class="rideListing"[^>]*>([\s\S]*?)<\/div>/gi);
      
      if (rideListingMatches) {
        console.log(`Found ${rideListingMatches.length} ride listings`);
        
        rideListingMatches.forEach((listing, index) => {
          try {
            const listingText = listing.replace(/<[^>]*>/g, '');
            
            // Skip the "Today" header
            if (listingText.includes('Today') || listingText.includes('MON AUG 18')) {
              return;
            }
            
            // Extract ride information using regex patterns
            const rideMatch = listingText.match(/(\w{3})\s+(\w{3})\s+(\d{1,2})\s+([^<]+)\s+<i>([^<]+)<\/i>/);
            
            if (rideMatch) {
              const dayName = rideMatch[1];
              const monthName = rideMatch[2];
              const day = parseInt(rideMatch[3]);
              const rating = rideMatch[4].trim();
              const rideName = rideMatch[5].trim();
              
              // Extract time information
              const timeMatch = listingText.match(/Meet at (\d{1,2}):(\d{2})\s+(am|pm)/i);
              let startTime = "TBD";
              let eventDateTime = null;
              
              if (timeMatch) {
                let hours = parseInt(timeMatch[1]);
                const minutes = parseInt(timeMatch[2]);
                const ampm = timeMatch[3].toLowerCase();
                
                // Convert to 24-hour format
                if (ampm === 'pm' && hours !== 12) hours += 12;
                if (ampm === 'am' && hours === 12) hours = 0;
                
                startTime = `${timeMatch[1]}:${timeMatch[2]} ${timeMatch[3].toUpperCase()}`;
                
                // Create date object (assuming current year)
                const currentYear = new Date().getFullYear();
                const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                                   'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                const monthIndex = monthNames.findIndex(name => 
                  monthName.toLowerCase().startsWith(name)
                );
                
                if (monthIndex !== -1) {
                  eventDateTime = new Date(currentYear, monthIndex, day, hours, minutes, 0, 0);
                }
              }
              
              // Extract start location
              const locationMatch = listingText.match(/Start Location:\s*([^<]+)/);
              const location = locationMatch ? locationMatch[1].trim() : "East Bay Area";
              
              // Extract description
              const descriptionMatch = listingText.match(/<p>([^<]+)<\/p>/);
              const description = descriptionMatch ? descriptionMatch[1].trim() : `${rating} rated ride`;
              
              console.log(`🎯 Found Grizzly Peak event: ${rideName} on ${monthName} ${day} at ${startTime}`);
              
              const event = {
                title: rideName,
                description: description,
                date_start: eventDateTime || new Date(),
                location: `${this.name}, ${location}`,
                source: 'grizzlypeak',
                source_url: this.url,
                category: 'Cycling',
                price: 'Free',
                image_url: '',
                time_text: startTime,
                venue: this.name
              };
              
              events.push(event);
            }
          } catch (error) {
            console.warn(`⚠️ Error processing listing ${index}: ${error.message}`);
          }
        });
      }
      
      // Alternative approach: look for any structured ride information
      if (events.length === 0) {
        console.log('🔍 No events found with main selectors, trying alternative approach...');
        
        // Look for any text that might contain ride information
        const rideMatches = pageContent.match(/(\w{3}\s+\w{3}\s+\d{1,2}[^<]+)/g);
        
        if (rideMatches) {
          rideMatches.forEach((match, index) => {
            if (match.includes('MON') || match.includes('TUE') || match.includes('WED') || 
                match.includes('THU') || match.includes('FRI') || match.includes('SAT') || match.includes('SUN')) {
                
              const event = {
                title: `Grizzly Peak Ride ${index + 1}`,
                description: `Cycling event: ${match.trim()}`,
                date_start: new Date(),
                location: `${this.name}, East Bay Area`,
                source: 'grizzlypeak',
                source_url: this.url,
                category: 'Cycling',
                price: 'Free',
                image_url: '',
                time_text: 'TBD',
                venue: this.name
              };
              
              events.push(event);
              console.log(`🎯 Found alternative Grizzly Peak event: ${match.trim()}`);
            }
          });
        }
      }
      
      return events;
      
    } catch (error) {
      console.error('❌ Error scraping events:', error.message);
      return [];
    }
  }
  
  cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  }
}

export default SimpleGrizzlyPeakScraper;
