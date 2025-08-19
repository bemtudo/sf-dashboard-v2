import puppeteer from 'puppeteer';

async function testRoxieMinimal() {
  console.log('🧪 Starting minimal Roxie test...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('🌐 Loading Roxie calendar page...');
    
    await page.goto('https://roxie.com/calendar/', { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for calendar elements...');
    await page.waitForSelector('.calendar-day-item', { timeout: 10000 });
    
    const html = await page.content();
    console.log(`📄 Page loaded: ${html.length} characters`);
    
    // Simple string-based extraction
    const events = [];
    
    // Find film titles
    const titleMatches = html.match(/<p[^>]*class="[^"]*film-title[^"]*"[^>]*>([^<]+)<\/p>/gi);
    if (titleMatches) {
      console.log(`🎬 Found ${titleMatches.length} film titles`);
      
      // Get first few titles
      titleMatches.slice(0, 5).forEach((match, i) => {
        const title = match.replace(/<[^>]*>/g, '').trim();
        console.log(`  ${i + 1}. ${title}`);
        events.push({ title });
      });
    }
    
    // Find showtimes
    const showtimeMatches = html.match(/<span[^>]*class="[^"]*film-showtime[^"]*"[^>]*>([^<]+)<\/span>/gi);
    if (showtimeMatches) {
      console.log(`🕐 Found ${showtimeMatches.length} showtimes`);
      
      // Get first few showtimes
      showtimeMatches.slice(0, 5).forEach((match, i) => {
        const time = match.replace(/<[^>]*>/g, '').trim();
        console.log(`  ${i + 1}. ${time}`);
      });
    }
    
    console.log(`✅ Test complete: ${events.length} events found`);
    return events;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return [];
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

testRoxieMinimal().catch(console.error);
