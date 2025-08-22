import { APEScraper } from './backend/scrapers/ape-scraper.js';

console.log('🔍 Testing APE scraper directly...');

try {
  const scraper = new APEScraper();
  console.log('✅ APE scraper created');
  
  const result = await scraper.scrape();
  console.log('✅ APE scraper result:', JSON.stringify(result, null, 2));
  
} catch (error) {
  console.error('❌ APE scraper error:', error.message);
  console.error(error.stack);
}

process.exit(0);

