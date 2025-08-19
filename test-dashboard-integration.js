#!/usr/bin/env node
// Test Dashboard Integration with Enhanced Service
// This simulates what the dashboard's EventScraper does

const SCRAPING_SERVICE_URL = 'http://localhost:3002';

async function testDashboardIntegration() {
  console.log('🧪 Testing Dashboard Integration with Enhanced Service...\n');
  
  try {
    // Step 1: Check if enhanced service is healthy
    console.log('🔍 Step 1: Checking enhanced service health...');
    const healthResponse = await fetch(`${SCRAPING_SERVICE_URL}/health`);
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    const health = await healthResponse.json();
    console.log(`✅ Service healthy: ${health.status} - ${health.message}\n`);
    
    // Step 2: Fetch events from enhanced service
    console.log('🔍 Step 2: Fetching events from enhanced service...');
    const eventsResponse = await fetch(`${SCRAPING_SERVICE_URL}/api/events`);
    if (!eventsResponse.ok) {
      throw new Error(`Events fetch failed: ${eventsResponse.status}`);
    }
    const events = await eventsResponse.json();
    console.log(`✅ Fetched ${events.length} events from enhanced service\n`);
    
    // Step 3: Display sample events
    console.log('🔍 Step 3: Sample events received:');
    events.slice(0, 3).forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.title}`);
      console.log(`      Date: ${event.date_start}`);
      console.log(`      Location: ${event.location}`);
      console.log(`      Category: ${event.category}`);
      console.log(`      Source: ${event.source}\n`);
    });
    
    // Step 4: Test individual scraper endpoint
    console.log('🔍 Step 4: Testing individual scraper endpoint...');
    const scraperResponse = await fetch(`${SCRAPING_SERVICE_URL}/api/scrapers/punchline/run`, {
      method: 'POST'
    });
    if (!scraperResponse.ok) {
      throw new Error(`Scraper run failed: ${scraperResponse.status}`);
    }
    const scraperResult = await scraperResponse.json();
    console.log(`✅ Scraper run successful: ${scraperResult.message}`);
    console.log(`   Events returned: ${scraperResult.result.count}\n`);
    
    // Step 5: Summary
    console.log('🎉 DASHBOARD INTEGRATION TEST PASSED!');
    console.log(`📊 Total events available: ${events.length}`);
    console.log(`🔗 Service URL: ${SCRAPING_SERVICE_URL}`);
    console.log(`💚 Health: ${health.status}`);
    console.log(`🚀 Ready for dashboard to connect!`);
    
  } catch (error) {
    console.error('❌ DASHBOARD INTEGRATION TEST FAILED:', error.message);
    console.error('   Make sure the enhanced service is running on port 3002');
  }
}

// Run the test
testDashboardIntegration();
