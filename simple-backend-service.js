import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
const PORT = 3002;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
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
    status: 'ok',
    service: 'sf-dashboard-simple-scraping',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    scrapersLoaded: scrapers.size,
    isInitialized: isInitialized,
    message: 'Simple scraper service running'
  });
});

// Main events endpoint
app.get('/api/events', async (req, res) => {
  try {
    console.log('📡 /api/events requested');
    const events = await runAllScrapers();
    
    // Filter out events with null dates
    const validEvents = events.filter(event => 
      event.date_start && 
      event.date_start !== null && 
      event.date_start !== 'null'
    );
    
    console.log(`📊 Returning ${validEvents.length} valid events out of ${events.length} total`);
    res.json(validEvents);
    
  } catch (error) {
    console.error('❌ Error in /api/events:', error);
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
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
