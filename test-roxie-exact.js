import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function testExactScraperLogic() {
  console.log('🧪 Testing exact scraper logic...');
  
  try {
    const url = 'https://roxie.com/calendar/';
    console.log(`🌐 Fetching ${url}...`);
    
    const response = await fetch(url, {
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
    const events = [];
    
    // EXACT LOGIC FROM OUR SCRAPER
    console.log('\n🔍 Testing exact scraper logic:');
    
    // Find calendar days with films - limit to first 3 days to avoid overwhelming
    const calendarDays = $('.calendar-day-item');
    console.log(`📅 Found ${calendarDays.length} calendar days, processing first 3`);
    
    calendarDays.slice(0, 3).each((dayIndex, dayElement) => {
      try {
        const $day = $(dayElement);
        
        // Get the day number
        const dayNumber = $day.find('.calendar-day').text().trim();
        console.log(`  📅 Day ${dayIndex}: dayNumber = "${dayNumber}"`);
        if (!dayNumber) return;

        // Get the month and year from the parent container
        const monthContainer = $day.closest('.full-calendar-block__month');
        const monthTitle = monthContainer.find('.calendar-block__month-title').text();
        console.log(`  📅 Month title: "${monthTitle}"`);
        const monthMatch = monthTitle.match(/(\w+)\s+(\d{4})/);
        
        if (!monthMatch) {
          console.log(`  ❌ No month match for: "${monthTitle}"`);
          return;
        }
        
        const monthName = monthMatch[1];
        const year = parseInt(monthMatch[2]);
        const monthIndex = getMonthIndex(monthName);
        const day = parseInt(dayNumber);

        // Create the date for this day
        const eventDate = new Date(year, monthIndex, day);
        console.log(`  📅 Created date: ${eventDate.toDateString()}`);

        // Find all films for this day
        const films = $day.find('span.film');
        console.log(`  🎬 Found ${films.length} films for this day`);
        
        films.each((filmIndex, filmElement) => {
          try {
            const $film = $(filmElement);
            
            // Get film title
            const title = $film.find('p.film-title').text().trim();
            console.log(`    🎬 Film ${filmIndex}: title = "${title}"`);
            if (!title) {
              console.log(`    ❌ No title found`);
              return;
            }

            // Get film URL
            const filmLink = $film.find('a[href*="/film/"]').first().attr('href');
            console.log(`    🔗 Film URL: ${filmLink}`);

            // Get all showtimes for this film
            const showtimes = [];
            $film.find('span.film-showtime').each((i, showtimeEl) => {
              const timeText = $(showtimeEl).text().trim();
              if (timeText) {
                showtimes.push(timeText);
              }
            });

            console.log(`    🕐 Found ${showtimes.length} showtimes: ${showtimes.join(', ')}`);

            if (showtimes.length === 0) {
              console.log(`    ⏭️ No showtimes found for "${title}"`);
              return;
            }

            console.log(`    ✅ Film "${title}" with ${showtimes.length} showtimes`);

            // For each showtime, create an individual event
            for (const showtime of showtimes) {
              try {
                const eventDateTime = combineDateAndTime(eventDate, showtime);
                if (!eventDateTime) {
                  console.log(`    ❌ Could not combine date and time for ${showtime}`);
                  continue;
                }

                const event = {
                  title: title,
                  description: `Film screening at Roxie Theater`,
                  date_start: eventDateTime,
                  time: showtime,
                  location: `Roxie Theater, San Francisco`,
                  source: "roxie",
                  source_url: url,
                  category: "Film",
                  price: "Varies",
                  image_url: "",
                  screen: "",
                  film_url: filmLink || ""
                };

                events.push(event);
                console.log(`    ✅ Created event: "${title}" at ${showtime}`);
              } catch (showtimeError) {
                console.log(`    ⚠️ Error processing showtime "${showtime}": ${showtimeError.message}`);
              }
            }
            
          } catch (filmError) {
            console.log(`    ⚠️ Error processing film ${filmIndex}: ${filmError.message}`);
          }
        });
        
      } catch (dayError) {
        console.log(`⚠️ Error processing day ${dayIndex}: ${dayError.message}`);
      }
    });

    console.log(`\n🎬 Scraping complete: ${events.length} events found`);
    return events;
    
  } catch (error) {
    console.error(`❌ An error occurred: ${error.message}`);
    return [];
  }
}

// Helper functions
function getMonthIndex(monthName) {
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

function combineDateAndTime(date, timeText) {
  try {
    if (!date || !timeText) return null;
    
    const timeMatch = timeText.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (!timeMatch) return null;
    
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toLowerCase();
    
    // Convert to 24-hour format
    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }
    
    // Create new date with the time
    const eventDate = new Date(date);
    eventDate.setHours(hours, minutes, 0, 0);
    
    return eventDate.toISOString();
  } catch (error) {
    console.error('❌ Error combining date and time:', error.message);
    return null;
  }
}

testExactScraperLogic().catch(console.error);
