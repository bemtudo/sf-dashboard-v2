import puppeteer from 'puppeteer';

async function testRoxieCalendar() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('🌐 Loading Roxie calendar page...');
    await page.goto('https://roxie.com/calendar/', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for dynamic content
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const content = await page.content();
    console.log(`📄 Page loaded, content length: ${content.length} characters`);
    
    // Look for any text that might indicate films
    if (content.includes('film-title')) console.log('✅ Found "film-title" in content');
    if (content.includes('film-showtime')) console.log('✅ Found "film-showtime" in content');
    if (content.includes('calendar-day-item')) console.log('✅ Found "calendar-day-item" in content');
    
    // Check for month/year info
    const monthMatch = content.match(/(\w+)\s+(\d{4})/);
    if (monthMatch) {
      console.log(`📅 Found month/year: ${monthMatch[1]} ${monthMatch[2]}`);
    }
    
    // Look for any time patterns
    const timeMatches = content.match(/(\d{1,2}:\d{2}\s*(?:am|pm))/gi);
    if (timeMatches) {
      console.log(`🕐 Found time patterns: ${timeMatches.slice(0, 5).join(', ')}`);
    }
    
    // Check for film titles using regex
    const titleMatches = content.match(/<[^>]*class="[^"]*film-title[^"]*"[^>]*>([^<]+)<\/[^>]*>/gi);
    if (titleMatches) {
      console.log(`🎬 Found film title matches: ${titleMatches.length}`);
      titleMatches.slice(0, 3).forEach((match, i) => {
        const title = match.replace(/<[^>]*>/g, '').trim();
        console.log(`  ${i + 1}. ${title}`);
      });
    }
    
    // Look for any div elements with calendar-related classes
    const calendarDivs = content.match(/<div[^>]*class="[^"]*(?:calendar|day|film)[^"]*"[^>]*>/gi);
    if (calendarDivs) {
      console.log(`📅 Found calendar-related divs: ${calendarDivs.length}`);
      
      // Look for calendar-day-item specifically
      const dayItems = content.match(/<div[^>]*class="[^"]*calendar-day-item[^"]*"[^>]*>([\s\S]*?)<\/div>/gi);
      if (dayItems) {
        console.log(`📅 Found calendar-day-item divs: ${dayItems.length}`);
        console.log('\n🔍 Sample calendar day structure:');
        console.log(dayItems[0].substring(0, 500));
      }
      
      // Look for film spans specifically
      const filmSpans = content.match(/<span[^>]*class="[^"]*film[^"]*"[^>]*>([\s\S]*?)<\/span>/gi);
      if (filmSpans) {
        console.log(`\n🎬 Found film spans: ${filmSpans.length}`);
        console.log('\n🔍 Sample film span structure:');
        console.log(filmSpans[0].substring(0, 500));
      }
      
      // Look for film-title paragraphs specifically
      const titleParagraphs = content.match(/<p[^>]*class="[^"]*film-title[^"]*"[^>]*>([\s\S]*?)<\/p>/gi);
      if (titleParagraphs) {
        console.log(`\n📝 Found film-title paragraphs: ${titleParagraphs.length}`);
        console.log('\n🔍 Sample film title structure:');
        console.log(titleParagraphs[0].substring(0, 200));
      }
      
      // Look for film-showtime spans specifically
      const showtimeSpans = content.match(/<span[^>]*class="[^"]*film-showtime[^"]*"[^>]*>([\s\S]*?)<\/span>/gi);
      if (showtimeSpans) {
        console.log(`\n🕐 Found film-showtime spans: ${showtimeSpans.length}`);
        console.log('\n🔍 Sample showtime structure:');
        console.log(showtimeSpans[0].substring(0, 200));
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testRoxieCalendar().catch(console.error);
