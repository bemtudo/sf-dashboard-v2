import SimpleGrizzlyPeakScraper from './simple-grizzlypeak-scraper.js';

async function testScraper() {
    console.log('🧪 Testing Grizzly Peak Scraper...');
    
    try {
        const scraper = new SimpleGrizzlyPeakScraper();
        const result = await scraper.scrape();
        
        console.log('✅ Scraper completed!');
        console.log('Result:', JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testScraper();
