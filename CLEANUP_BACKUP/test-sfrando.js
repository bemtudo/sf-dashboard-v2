import SimpleSFRandoScraper from './simple-sfrando-scraper.js';

async function testScraper() {
    console.log('🧪 Testing SF Rando Scraper...');
    
    try {
        const scraper = new SimpleSFRandoScraper();
        const result = await scraper.scrape();
        
        console.log('✅ Scraper completed!');
        console.log('Result:', JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testScraper();
