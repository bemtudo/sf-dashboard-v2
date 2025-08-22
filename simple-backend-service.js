import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
const PORT = 3002;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(express.json());

// Store scrapers
let scrapers = new Map();
let isInitialized = false;

// Initialize all scrapers
async function initializeScrapers() {
  if (isInitialized) return;
  
  console.log('🚀 Initializing all scrapers...');
  
  try {
    // Import all scraper modules
    const scraperModules = [
      'ape-scraper.js',
      'balboa-scraper.js',
      'booksmith-scraper.js',
      'cafedunord-scraper.js',
      'chapel-scraper.js',
      'cityarts-scraper.js',
      'cobbs-scraper.js',
      'commonwealth-scraper.js',
      'creativemornings-scraper.js',
      'gamh-scraper.js',
      'giants-scraper.js',
      'grizzlypeak-scraper.js',
      'greenapple-scraper.js',
      'knockout-scraper.js',
      'oaklandroots-scraper.js',
      'punchline-scraper.js',
      'rickshawstop-scraper.js',
      'roxie-scraper.js',
      'sfcityfc-scraper.js',
      'sfpl-scraper.js',
      'sfrando-scraper.js',
      'strava-scraper.js',
      'valkyries-scraper.js',
      'warriors-scraper.js'
    ];

    for (const moduleName of scraperModules) {
      try {
        const scraperName = moduleName.replace('-scraper.js', '');
        console.log(`📦 Loading ${scraperName} scraper...`);
        
        const module = await import(`./backend/scrapers/${moduleName}`);
        
        // Find the scraper class
        let ScraperClass = null;
        const possibleNames = [
          `${scraperName.charAt(0).toUpperCase() + scraperName.slice(1)}Scraper`,
          `${scraperName.toUpperCase()}Scraper`,
          // Add specific mappings for known class names
          scraperName === 'cafedunord' ? 'CafeDuNordScraper' : null,
          scraperName === 'creativemornings' ? 'CreativeMorningsScraper' : null,
          scraperName === 'grizzlypeak' ? 'GrizzlyPeakScraper' : null,
          scraperName === 'oaklandroots' ? 'OaklandRootsScraper' : null,
          scraperName === 'rickshawstop' ? 'RickshawStopScraper' : null,
          scraperName === 'sfcityfc' ? 'SFCityFCScraper' : null,
          scraperName === 'sfrando' ? 'SFRandoScraper' : null,
          scraperName === 'sfpl' ? 'SFPLScraper' : null,
          scraperName === 'gamh' ? 'GAMHScraper' : null,
          scraperName === 'valkyries' ? 'ValkyriesScraper' : null,
          scraperName === 'warriors' ? 'WarriorsScraper' : null,
          scraperName === 'greenapple' ? 'greenapple' : null,
          scraperName === 'cityarts' ? 'scrapeCityArts' : null,
          'BaseScraper'
        ].filter(Boolean); // Remove null values
        
        for (const className of possibleNames) {
          if (module[className]) {
            ScraperClass = module[className];
            break;
          }
        }
        
        if (ScraperClass) {
          const scraper = new ScraperClass();
          scrapers.set(scraperName, scraper);
          console.log(`✅ Loaded ${scraperName} scraper`);
        } else {
          console.warn(`⚠️ Could not find scraper class for ${scraperName}`);
        }
        
      } catch (error) {
        console.warn(`⚠️ Failed to load ${moduleName}:`, error.message);
      }
    }
    
    console.log(`🎉 Successfully loaded ${scrapers.size} scrapers`);
    isInitialized = true;
    
  } catch (error) {
    console.error('❌ Failed to initialize scrapers:', error);
  }
}

// Run all scrapers and return combined events
async function runAllScrapers() {
  if (!isInitialized) {
    await initializeScrapers();
  }
  
  console.log('🔄 Running all scrapers...');
  const allEvents = [];
  const startTime = Date.now();
  
  // Run scrapers in parallel (limit concurrency to avoid overwhelming websites)
  const concurrency = 3;
  const scraperArray = Array.from(scrapers.entries());
  const chunks = [];
  
  for (let i = 0; i < scraperArray.length; i += concurrency) {
    chunks.push(scraperArray.slice(i, i + concurrency));
  }
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`🔄 Running batch ${i + 1}/${chunks.length} (${chunk.length} scrapers)`);
    
    const chunkPromises = chunk.map(async ([name, scraper]) => {
      try {
        console.log(`🚀 Starting ${name} scraper...`);
        const start = Date.now();
        
        let events = [];
        if (scraper.scrape && typeof scraper.scrape === 'function') {
          // For BaseScraper-based scrapers, use the scrape() method which properly manages browser lifecycle
          // Add timeout protection to prevent hanging
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Scraper timeout after 60 seconds')), 60000)
          );
          
          const result = await Promise.race([
            scraper.scrape(),
            timeoutPromise
          ]);
          
          events = result.events || [];
        } else if (scraper.scrapeEvents && typeof scraper.scrapeEvents === 'function') {
          // For standalone scrapers, use scrapeEvents() directly
          // Add timeout protection to prevent hanging
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Scraper timeout after 60 seconds')), 60000)
          );
          
          events = await Promise.race([
            scraper.scrapeEvents(),
            timeoutPromise
          ]);
        } else {
          console.warn(`⚠️ ${name} scraper has no valid scraping method`);
          return [];
        }
        
        const duration = Date.now() - start;
        console.log(`✅ ${name}: ${events.length} events in ${duration}ms`);
        
        // Add source info to events
        events.forEach(event => {
          event.source = name;
          if (!event.source_url) {
            event.source_url = scraper.url || '';
          }
        });
        
        return events;
        
      } catch (error) {
        console.error(`❌ ${name} scraper failed:`, error.message);
        return [];
      }
    });
    
    const chunkResults = await Promise.all(chunkPromises);
    chunkResults.forEach(events => allEvents.push(...events));
    
    // Small delay between batches to be respectful to websites
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  const totalDuration = Date.now() - startTime;
  console.log(`🎉 All scrapers completed: ${allEvents.length} total events in ${totalDuration}ms`);
  
  return allEvents;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    scrapersLoaded: scrapers.size,
    isInitialized
  });
});

// Analyze new venue URL and suggest scraper approach
app.post('/api/analyze-venue', async (req, res) => {
  try {
    const { url, name } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    console.log(`🔍 Analyzing venue: ${name} at ${url}`);
    
    // Basic URL analysis
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // Check if it's a known platform
    let platform = 'unknown';
    let suggestedApproach = 'manual';
    
    if (domain.includes('eventbrite.com')) {
      platform = 'eventbrite';
      suggestedApproach = 'eventbrite-api';
    } else if (domain.includes('ticketmaster.com')) {
      platform = 'ticketmaster';
      suggestedApproach = 'ticketmaster-api';
    } else if (domain.includes('seetickets.com')) {
      platform = 'seetickets';
      suggestedApproach = 'puppeteer';
    } else if (domain.includes('ticketfly.com')) {
      platform = 'ticketfly';
      suggestedApproach = 'puppeteer';
    } else if (domain.includes('brownpapertickets.com')) {
      platform = 'brownpapertickets';
      suggestedApproach = 'puppeteer';
    } else if (domain.includes('wordpress.com') || domain.includes('wp-content')) {
      platform = 'wordpress';
      suggestedApproach = 'cheerio';
    } else if (domain.includes('squarespace.com')) {
      platform = 'squarespace';
      suggestedApproach = 'cheerio';
    } else if (domain.includes('wix.com')) {
      platform = 'wix';
      suggestedApproach = 'puppeteer';
    }
    
    // Try to fetch the page to analyze structure
    let pageAnalysis = null;
    try {
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      
      // Check for common event indicators
      const eventIndicators = await page.evaluate(() => {
        const indicators = {
          hasCalendar: !!document.querySelector('input[type="date"], .calendar, .date-picker'),
          hasEventList: !!document.querySelector('.event, .events, .event-list, .events-list'),
          hasRSS: !!document.querySelector('link[type="application/rss+xml"]'),
          hasJSONLD: !!document.querySelector('script[type="application/ld+json"]'),
          hasEventSchema: !!document.querySelector('[itemtype*="Event"]'),
          hasUpcomingEvents: document.body.textContent.includes('Upcoming Events') || document.body.textContent.includes('Events'),
          hasTickets: document.body.textContent.includes('Buy Tickets') || document.body.textContent.includes('Get Tickets'),
          pageTitle: document.title,
          metaDescription: document.querySelector('meta[name="description"]')?.content || ''
        };
        return indicators;
      });
      
      pageAnalysis = eventIndicators;
      await browser.close();
      
    } catch (error) {
      console.log(`⚠️ Could not analyze page structure: ${error.message}`);
    }
    
    const analysis = {
      venue: { name, url, domain },
      platform,
      suggestedApproach,
      pageAnalysis,
      recommendations: [
        `Use ${suggestedApproach} approach for this platform`,
        platform === 'unknown' ? 'Manual analysis required - check for RSS feeds, event APIs, or custom event listings' : '',
        pageAnalysis?.hasRSS ? 'RSS feed detected - consider RSS scraping approach' : '',
        pageAnalysis?.hasJSONLD ? 'Structured data detected - JSON-LD parsing recommended' : '',
        pageAnalysis?.hasEventSchema ? 'Schema.org events detected - structured parsing recommended' : ''
      ].filter(Boolean)
    };
    
    console.log(`✅ Venue analysis complete:`, analysis);
    res.json(analysis);
    
  } catch (error) {
    console.error('❌ Error analyzing venue:', error);
    res.status(500).json({ error: 'Failed to analyze venue', details: error.message });
  }
});

// Status endpoint to check if events are available
app.get('/api/status', (req, res) => {
  const hasEvents = global.cachedEvents && global.cachedEvents.length > 0;
  res.json({
    status: 'ok',
    hasEvents: hasEvents,
    eventCount: hasEvents ? global.cachedEvents.length : 0,
    message: hasEvents ? 'Events available' : 'No events cached. Run scrapers via /api/run-scrapers',
    timestamp: new Date().toISOString()
  });
});

// Main events endpoint
app.get('/api/events', async (req, res) => {
  try {
    console.log('📡 /api/events requested');
    
    // Check if we have cached events or if scrapers need to be run
    if (!global.cachedEvents || global.cachedEvents.length === 0) {
      return res.json({
        message: 'No events available. Run scrapers first via /api/run-scrapers',
        events: [],
        count: 0
      });
    }
    
    console.log(`📊 Returning ${global.cachedEvents.length} cached events`);
    res.json(global.cachedEvents);
    
  } catch (error) {
    console.error('❌ Error in /api/events:', error);
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
  }
});

// New endpoint to manually run scrapers
app.post('/api/run-scrapers', async (req, res) => {
  try {
    console.log('🚀 /api/run-scrapers requested - starting all scrapers...');
    const events = await runAllScrapers();
    
    // Filter out events with null dates
    const validEvents = events.filter(event => 
      event.date_start && 
      event.date_start !== null && 
      event.date_start !== 'null'
    );
    
    // Cache the results
    global.cachedEvents = validEvents;
    
    console.log(`📊 Scrapers completed: ${validEvents.length} valid events out of ${events.length} total`);
    res.json({
      message: 'Scrapers completed successfully',
      events: validEvents,
      count: validEvents.length,
      success: true
    });
    
  } catch (error) {
    console.error('❌ Error running scrapers:', error);
    res.status(500).json({ error: 'Failed to run scrapers', details: error.message });
  }
});

// Test individual scraper endpoint
app.get('/api/test/:scraper', async (req, res) => {
  const scraperName = req.params.scraper;
  
  if (!scrapers.has(scraperName)) {
    return res.status(404).json({ error: `Scraper '${scraperName}' not found` });
  }
  
  try {
    const scraper = scrapers.get(scraperName);
    console.log(`🧪 Testing ${scraperName} scraper...`);
    
    let events = [];
    if (scraper.scrape && typeof scraper.scrape === 'function') {
      // For BaseScraper-based scrapers, use the scrape() method which properly manages browser lifecycle
      // Add timeout protection to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Scraper timeout after 60 seconds')), 60000)
      );
      
      const result = await Promise.race([
        scraper.scrape(),
        timeoutPromise
      ]);
      
      events = result.events || [];
    } else if (scraper.scrapeEvents && typeof scraper.scrapeEvents === 'function') {
      // For standalone scrapers, use scrapeEvents() directly
      // Add timeout protection to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Scraper timeout after 60 seconds')), 60000)
      );
      
      events = await Promise.race([
        scraper.scrapeEvents(),
        timeoutPromise
      ]);
    } else {
      console.warn(`⚠️ ${scraperName} scraper has no valid scraping method`);
      return res.status(500).json({ 
        scraper: scraperName,
        error: 'Scraper has no valid scraping method',
        success: false
      });
    }
    
    res.json({
      scraper: scraperName,
      events: events,
      count: events.length,
      success: true
    });
    
  } catch (error) {
    console.error(`❌ Error testing ${scraperName}:`, error);
    res.status(500).json({ 
      scraper: scraperName,
      error: error.message,
      success: false
    });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 SF Dashboard Simple Scraping Service starting on port ${PORT}...`);
  
  // Initialize scrapers on startup
  await initializeScrapers();
  
  console.log(`🌐 Service running at http://localhost:${PORT}`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Events: http://localhost:${PORT}/api/events`);
  console.log(`🧪 Test scraper: http://localhost:${PORT}/api/test/{scraper-name}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});
