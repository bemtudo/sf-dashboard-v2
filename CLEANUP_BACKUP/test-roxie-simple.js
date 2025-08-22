import puppeteer from 'puppeteer';

async function testRoxieSimple() {
  console.log('🧪 Starting simple Roxie test...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('🌐 Loading Roxie calendar page...');
    
    // Set a very short timeout
    await page.goto('https://roxie.com/calendar/', { 
      waitUntil: 'domcontentloaded', // Don't wait for network idle
      timeout: 10000 // Only 10 seconds
    });
    
    console.log('✅ Page loaded successfully');
    
    // Get basic page info
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // Check if we can find any calendar elements
    const calendarDays = await page.$$('.calendar-day-item');
    console.log(`📅 Found ${calendarDays.length} calendar days`);
    
    if (calendarDays.length > 0) {
      console.log('🎯 Calendar elements found - page is working');
    } else {
      console.log('❌ No calendar elements found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

testRoxieSimple().catch(console.error);
