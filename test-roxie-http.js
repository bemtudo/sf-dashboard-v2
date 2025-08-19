import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function testRoxieHttp() {
  console.log('🧪 Testing Roxie HTTP scraper...');
  
  try {
    const response = await fetch('https://roxie.com/calendar/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`📄 Page loaded: ${html.length} characters`);
    
    const $ = cheerio.load(html);
    
    // Test our selectors
    console.log('\n🔍 Testing selectors:');
    
    const calendarDays = $('.calendar-day-item');
    console.log(`📅 Calendar days found: ${calendarDays.length}`);
    
    const filmTitles = $('p.film-title');
    console.log(`🎬 Film titles found: ${filmTitles.length}`);
    
    const showtimes = $('span.film-showtime');
    console.log(`🕐 Showtimes found: ${showtimes.length}`);
    
    // Look for any calendar-related elements
    const calendarElements = $('[class*="calendar"]');
    console.log(`📅 Calendar-related elements: ${calendarElements.length}`);
    
    // Look for any film-related elements
    const filmElements = $('[class*="film"]');
    console.log(`🎬 Film-related elements: ${filmElements.length}`);
    
    // Show first few film titles if found
    if (filmTitles.length > 0) {
      console.log('\n🎬 First few film titles:');
      filmTitles.slice(0, 5).each((i, el) => {
        console.log(`  ${i + 1}. ${$(el).text().trim()}`);
      });
    }
    
    // Show first few showtimes if found
    if (showtimes.length > 0) {
      console.log('\n🕐 First few showtimes:');
      showtimes.slice(0, 5).each((i, el) => {
        console.log(`  ${i + 1}. ${$(el).text().trim()}`);
      });
    }
    
    // If no elements found, let's look at the actual HTML structure
    if (calendarDays.length === 0 && filmTitles.length === 0) {
      console.log('\n🔍 No expected elements found. Looking at HTML structure...');
      
      // Look for any divs with calendar-like content
      const allDivs = $('div');
      console.log(`📄 Total divs: ${allDivs.length}`);
      
      // Look for elements with calendar in class or id
      const calendarLike = $('[class*="calendar"], [id*="calendar"]');
      console.log(`📅 Calendar-like elements: ${calendarLike.length}`);
      
      if (calendarLike.length > 0) {
        console.log('\n📅 Calendar-like elements found:');
        calendarLike.slice(0, 3).each((i, el) => {
          const $el = $(el);
          console.log(`  ${i + 1}. Class: "${$el.attr('class')}", ID: "${$el.attr('id')}"`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRoxieHttp().catch(console.error);
