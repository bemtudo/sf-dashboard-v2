#!/usr/bin/env node

/**
 * Enhanced SF Dashboard Scraping Service
 * 
 * This service integrates with your existing real scrapers to provide
 * actual event data instead of sample data.
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Import your existing scraper infrastructure
import SimplePunchlineScraper from './simple-punchline-scraper.js';
import SimpleRoxieScraper from './simple-roxie-scraper.js';
import IndependentHTMLParser from './independent-html-parser.js';

let EventDatabase, ScraperManager;
let db, scraperManager;

async function initializeRealScrapers() {
  try {
    console.log('🔍 Attempting to initialize real scrapers...');
    
    // Dynamic import to avoid module resolution issues
    const backendPath = './backend';
    
    // Import your existing modules
    const databaseModule = await import(`${backendPath}/database.js`);
    const scraperManagerModule = await import(`${backendPath}/scraper-manager.js`);
    
    EventDatabase = databaseModule.default;
    ScraperManager = scraperManagerModule.default;
    
    // Initialize database. We'll only call init() here.
    db = new EventDatabase();
    await db.init();
    
    // Pass the initialized database instance to ScraperManager
    scraperManager = new ScraperManager(db);
    await scraperManager.init(); // Initialize scrapers from database
    
    // Debug: Let's see what methods are actually available on scraperManager
    console.log('🔍 ScraperManager methods available:', Object.getOwnPropertyNames(Object.getPrototypeOf(scraperManager)));
    console.log('🔍 ScraperManager direct properties:', Object.keys(scraperManager));
    console.log('🔍 ScraperManager scrapers property:', scraperManager.scrapers ? 'exists' : 'missing');
    
    console.log('✅ Real scrapers initialized successfully');
    console.log(`🔍 Available scrapers: ${scraperManager.scrapers.size}`);
    
    // Also initialize local scrapers for testing
    await initializeLocalScrapers();
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize real scrapers:', error.message);
    console.log('⚠️ Falling back to working scrapers mode');
    
    // Still try to initialize local scrapers for testing
    await initializeLocalScrapers();
    
    return false;
  }
}

// Sample data as fallback
const sampleEvents = [
  {
    title: "Comedy Night at Punchline",
    description: "Featured comedians from the Bay Area",
    date_start: new Date().toISOString(),
    location: "Punchline Comedy Club, San Francisco",
    source: "punchline",
    source_url: "https://www.punchlinecomedyclub.com/events",
    category: "Comedy",
    price: "$25"
  },
  {
    title: "Library Book Club",
    description: "Monthly book discussion group",
    date_start: new Date(Date.now() + 86400000).toISOString(),
    location: "San Francisco Public Library",
    source: "sfpl",
    source_url: "https://sfpl.org/events",
    category: "Education",
    price: "Free"
  },
  {
    title: "Live Music at GAMH",
    description: "Alternative rock night with local bands",
    date_start: new Date(Date.now() + 172800000).toISOString(),
    location: "Great American Music Hall",
    source: "gamh",
    source_url: "https://www.gamh.com/events",
    category: "Music",
    price: "$35"
  }
];

// Local scraper testing - for debugging specific scrapers
let localScrapers = {};

async function initializeLocalScrapers() {
  try {
    // Import our local Knockout scraper for testing
    import('./backend/scrapers/knockout-scraper.js').then(module => {
      const KnockoutScraper = module.KnockoutScraper;
      localScrapers.knockout = new KnockoutScraper();
      console.log('✅ Local Knockout scraper loaded successfully');
    }).catch(error => {
      console.log('⚠️ Could not load local Knockout scraper:', error.message);
    });
    
    // Import our local Rickshaw Stop scraper for testing
    import('./backend/scrapers/rickshawstop-scraper.js').then(module => {
      const RickshawStopScraper = module.RickshawStopScraper;
      localScrapers.rickshawstop = new RickshawStopScraper();
      console.log('✅ Local Rickshaw Stop scraper loaded successfully');
    }).catch(error => {
      console.log('⚠️ Could not load local Rickshaw Stop scraper:', error.message);
    });

    // Load local Giants scraper
    try {
      console.log('⚾ Loading local Giants scraper...');
      const { GiantsScraper } = await import('./backend/scrapers/giants-scraper.js');
      localScrapers.giants = new GiantsScraper();
      console.log('✅ Local Giants scraper loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load local Giants scraper:', error.message);
    }

    // Load local Grizzly Peak scraper
    try {
      console.log('🚴 Loading local Grizzly Peak scraper...');
      const { GrizzlyPeakScraper } = await import('./backend/scrapers/grizzlypeak-scraper.js');
      localScrapers.grizzlypeak = new GrizzlyPeakScraper();
      console.log('✅ Local Grizzly Peak scraper loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load local Grizzly Peak scraper:', error.message);
    }

    // Load local SF Rando scraper
    try {
      console.log('🚴 Loading local SF Rando scraper...');
      const { SFRandoScraper } = await import('./backend/scrapers/sfrando-scraper.js');
      localScrapers.sfrando = new SFRandoScraper();
      console.log('✅ Local SF Rando scraper loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load local SF Rando scraper:', error.message);
    }
  } catch (error) {
    console.log('⚠️ Error initializing local scrapers:', error.message);
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'sf-dashboard-enhanced-scraping',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    realScrapers: !!scraperManager,
    scraperCount: scraperManager ? scraperManager.scrapers.size : 0,
    localScrapers: Object.keys(localScrapers),
    message: scraperManager ? 'Real scrapers are running!' : 'Using sample data mode'
  });
});

// Test local Knockout scraper
app.get('/api/test-knockout', async (req, res) => {
  try {
    if (!localScrapers.knockout) {
      return res.status(404).json({ error: 'Local Knockout scraper not loaded' });
    }
    
    console.log('🧪 Testing local Knockout scraper...');
    const events = await localScrapers.knockout.scrapeEvents();
    
    res.json({
      success: true,
      scraper: 'knockout',
      eventsFound: events.length,
      events: events
    });
    
  } catch (error) {
    console.error('❌ Error testing local Knockout scraper:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test local Rickshaw Stop scraper
app.get('/api/test-rickshawstop', async (req, res) => {
  try {
    if (!localScrapers.rickshawstop) {
      return res.status(404).json({ error: 'Local Rickshaw Stop scraper not available' });
    }
    
    console.log('🧪 Testing local Rickshaw Stop scraper...');
    const events = await localScrapers.rickshawstop.scrapeEvents();
    
    if (events && events.length > 0) {
      console.log(`Found ${events.length} events from Rickshaw Stop`);
      res.json(events);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error testing Rickshaw Stop scraper:', error);
    res.status(500).json({ error: 'Failed to test Rickshaw Stop scraper' });
  }
});

// Test local Giants scraper
app.get('/api/test-giants', async (req, res) => {
  try {
    if (!localScrapers.giants) {
      return res.status(404).json({ error: 'Local Giants scraper not available' });
    }
    
    console.log('🧪 Testing local Giants scraper...');
    const events = await localScrapers.giants.scrapeEvents();
    
    if (events && events.length > 0) {
      console.log(`Found ${events.length} events from Giants`);
      res.json(events);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error testing Giants scraper:', error);
    res.status(500).json({ error: 'Failed to test Giants scraper' });
  }
});

// Test local Grizzly Peak scraper
app.get('/api/test-grizzlypeak', async (req, res) => {
  try {
    if (!localScrapers.grizzlypeak) {
      return res.status(404).json({ error: 'Local Grizzly Peak scraper not available' });
    }
    
    console.log('🧪 Testing local Grizzly Peak scraper...');
    const events = await localScrapers.grizzlypeak.scrapeEvents();
    
    if (events && events.length > 0) {
      console.log(`Found ${events.length} events from Grizzly Peak`);
      res.json(events);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error testing Grizzly Peak scraper:', error);
    res.status(500).json({ error: 'Failed to test Grizzly Peak scraper' });
  }
});

// Test local SF Rando scraper
app.get('/api/test-sfrando', async (req, res) => {
  try {
    if (!localScrapers.sfrando) {
      return res.status(404).json({ error: 'Local SF Rando scraper not available' });
    }
    
    console.log('🧪 Testing local SF Rando scraper...');
    const events = await localScrapers.sfrando.scrapeEvents();
    
    if (events && events.length > 0) {
      console.log(`Found ${events.length} events from SF Rando`);
      res.json(events);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error testing SF Rando scraper:', error);
    res.status(500).json({ error: 'Failed to test SF Rando scraper' });
  }
});

// Clear old Knockout data and replace with new data
app.post('/api/fix-knockout', async (req, res) => {
  try {
    if (!localScrapers.knockout || !db) {
      return res.status(404).json({ error: 'Local scraper or database not available' });
    }
    
    console.log('🔧 Fixing Knockout data...');
    
    // 1. Clear all events to remove the broken ones
    await db.clearAllEvents();
    console.log('🗑️ Cleared all events from database');
    
    // 2. Scrape new events
    const newEvents = await localScrapers.knockout.scrapeEvents();
    console.log(`📊 Scraped ${newEvents.length} new Knockout events`);
    
    // 3. Return the events (frontend can handle them)
    res.json({
      success: true,
      scraped: newEvents.length,
      events: newEvents,
      message: 'Knockout data fixed! Database cleared, new events available.'
    });
    
  } catch (error) {
    console.error('❌ Error fixing Knockout data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Populate database with working local scraper data
app.post('/api/populate-knockout', async (req, res) => {
  try {
    if (!localScrapers.knockout || !db) {
      return res.status(404).json({ error: 'Local scraper or database not available' });
    }
    
    console.log('📊 Populating database with working Knockout data...');
    
    // 1. Scrape working events
    const workingEvents = await localScrapers.knockout.scrapeEvents();
    console.log(`📊 Scraped ${workingEvents.length} working events`);
    
    // 2. Clear old broken events first
    await db.clearAllEvents();
    console.log('🗑️ Cleared old broken events');
    
    // 3. Try to add events to database (if method exists)
    let savedCount = 0;
    let errorCount = 0;
    
    for (const event of workingEvents) {
      try {
        // Try different possible database methods
        if (db.addEvent) {
          await db.addEvent(event);
          savedCount++;
        } else if (db.insertEvent) {
          await db.insertEvent(event);
          savedCount++;
        } else if (db.saveEvent) {
          await db.saveEvent(event);
          savedCount++;
        } else {
          console.log('⚠️ No database add method found, events will be returned only');
          break;
        }
      } catch (error) {
        console.error('Error saving event:', error);
        errorCount++;
      }
    }
    
    if (savedCount > 0) {
      console.log(`✅ Successfully saved ${savedCount} events to database`);
      res.json({
        success: true,
        scraped: workingEvents.length,
        saved: savedCount,
        errors: errorCount,
        message: `Database populated with ${savedCount} working Knockout events!`
      });
    } else {
      console.log('⚠️ Could not save to database, returning events for manual handling');
      res.json({
        success: true,
        scraped: workingEvents.length,
        saved: 0,
        events: workingEvents,
        message: 'Events scraped but could not save to database. Use these events manually.'
      });
    }
    
  } catch (error) {
    console.error('❌ Error populating Knockout data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Populate database with Rickshaw Stop events
app.post('/api/populate-rickshawstop', async (req, res) => {
  try {
    if (!localScrapers.rickshawstop || !db) {
      return res.status(404).json({ error: 'Local scraper or database not available' });
    }
    
    console.log('📊 Populating database with working Rickshaw Stop data...');
    
    // 1. Scrape working events
    const workingEvents = await localScrapers.rickshawstop.scrapeEvents();
    console.log(`📊 Scraped ${workingEvents.length} working events`);
    
    // 2. Try to add events to database (if method exists)
    let savedCount = 0;
    let errorCount = 0;
    
    for (const event of workingEvents) {
      try {
        // Try different possible database methods
        if (db.addEvent) {
          await db.addEvent(event);
          savedCount++;
        } else if (db.insertEvent) {
          await db.insertEvent(event);
          savedCount++;
        } else if (db.saveEvent) {
          await db.saveEvent(event);
          savedCount++;
        } else {
          console.log('⚠️ No database add method found, events will be returned only');
          break;
        }
      } catch (error) {
        console.error('Error saving event:', error);
        errorCount++;
      }
    }
    
    if (savedCount > 0) {
      console.log(`✅ Successfully saved ${savedCount} Rickshaw Stop events to database`);
      res.json({
        success: true,
        scraped: workingEvents.length,
        saved: savedCount,
        errors: errorCount,
        message: `Database populated with ${savedCount} working Rickshaw Stop events!`
      });
    } else {
      console.log('⚠️ Could not save to database, returning events for manual handling');
      res.json({
        success: true,
        scraped: workingEvents.length,
        saved: 0,
        events: workingEvents,
        message: 'Events scraped but could not save to database. Use these events manually.'
      });
    }
    
  } catch (error) {
    console.error('❌ Error populating Rickshaw Stop data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    // First, try to get events from real scrapers (Roxie, Balboa, Valkyries, etc.)
    if (scraperManager) {
      try {
        console.log('🔄 Fetching events from real scrapers...');
        const events = await scraperManager.runAllScrapers();
        
        if (events && events.length > 0) {
          // Filter out events with null dates (from broken CloudStorage scrapers)
          const validEvents = events.filter(event => event.date_start !== null && event.date_start !== 'null');
          console.log(`📊 Found ${events.length} total events, filtering to ${validEvents.length} valid events`);
          
          if (validEvents.length > 0) {
            console.log('✅ Returning events from real scrapers');
            res.json(validEvents);
            return;
          }
        }
      } catch (error) {
        console.error('❌ Real scrapers failed:', error.message);
      }
    }
    
    // Fallback to working local scrapers (Knockout and Rickshaw Stop)
    console.log('🔄 Falling back to working local scrapers...');
    let allLocalEvents = [];
    
    // Try our working Knockout scraper
    if (localScrapers.knockout) {
      try {
        console.log('🥊 Running local Knockout scraper...');
        const knockoutEvents = await localScrapers.knockout.scrapeEvents();
        if (knockoutEvents && knockoutEvents.length > 0) {
          console.log(`✅ Local Knockout scraper found ${knockoutEvents.length} events`);
          allLocalEvents = allLocalEvents.concat(knockoutEvents);
        }
      } catch (error) {
        console.error('Error running local Knockout scraper:', error);
      }
    }
    
    // Try our working Rickshaw Stop scraper
    if (localScrapers.rickshawstop) {
      try {
        console.log('🎵 Running local Rickshaw Stop scraper...');
        const rickshawEvents = await localScrapers.rickshawstop.scrapeEvents();
        if (rickshawEvents && rickshawEvents.length > 0) {
          console.log(`✅ Local Rickshaw Stop scraper found ${rickshawEvents.length} events`);
          allLocalEvents = allLocalEvents.concat(rickshawEvents);
        }
      } catch (error) {
        console.error('Error running local Rickshaw Stop scraper:', error);
      }
    }
    
    // Return local events if we have them
    if (allLocalEvents.length > 0) {
      console.log(`🎉 Returning ${allLocalEvents.length} events from working local scrapers`);
      res.json(allLocalEvents);
      return;
    }
    
    // No events found from any source
    console.log('📭 No events found from any source');
    res.json([]);
    
  } catch (error) {
    console.error('❌ Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// 🗑️ Clear all events from database
app.delete('/api/events', async (req, res) => {
  try {
    if (db) {
      console.log('🗑️ Clearing all events from database...');
      await db.clearAllEvents();
      console.log('✅ Database cleared successfully');
      res.json({ 
        success: true, 
        message: 'All events cleared from database',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({ error: 'Database not available' });
    }
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    res.status(500).json({ error: 'Failed to clear database' });
  }
});

// Clear all events from database
app.post('/api/clear-database', async (req, res) => {
  try {
    if (!db) {
      res.status(503).json({
        success: false,
        message: 'Database not available',
        timestamp: new Date().toISOString()
      });
      return;
    }

    console.log('🗑️ Clearing all events from database...');
    await db.clearAllEvents();
    
    res.json({
      success: true,
      message: 'Database cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear database',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get events by source
app.get('/api/events/:source', async (req, res) => {
  try {
    const { source } = req.params;
    
    if (db && scraperManager) {
      // Use real scrapers
      const events = await db.getEventsBySource(source, 50);
      res.json(events);
    } else {
      // Fallback to sample data
      const events = sampleEvents.filter(event => event.source === source);
      res.json(events);
    }
  } catch (error) {
    console.error(`Error fetching events for ${req.params.source}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Get all scrapers
app.get('/api/scrapers', async (req, res) => {
  try {
    if (db && scraperManager) {
      // Use real scrapers
      const scrapers = await db.getScrapers();
      res.json(scrapers);
    } else {
      // Fallback to sample scrapers
      const sampleScrapers = [
        { name: 'punchline', enabled: true, lastRun: new Date().toISOString() },
        { name: 'sfpl', enabled: true, lastRun: new Date().toISOString() },
        { name: 'gamh', enabled: true, lastRun: new Date().toISOString() }
      ];
      res.json(sampleScrapers);
    }
  } catch (error) {
    console.error('Error fetching scrapers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get scraper status
app.get('/api/scrapers/status', async (req, res) => {
  try {
    if (scraperManager) {
      // Use real scrapers
      const status = await scraperManager.getScraperStatus();
      res.json(status);
    } else {
      // No real scrapers available
      res.status(503).json({ 
        error: 'No real scrapers available',
        message: 'Real scrapers not initialized'
      });
    }
  } catch (error) {
    console.error('Error fetching scraper status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Run all scrapers
app.post('/api/scrapers/run-all', async (req, res) => {
  try {
    if (scraperManager) {
      // Use real scrapers
      console.log('🚀 Manual scraper run requested (real scrapers)');
      const results = await scraperManager.runAllScrapers();
      
      res.json({ 
        success: true, 
        message: 'All real scrapers completed',
        results,
        timestamp: new Date().toISOString(),
        mode: 'real-scrapers'
      });
      
    } else {
      // No real scrapers available
      console.log('🚫 No real scrapers available');
      res.status(503).json({ 
        success: false, 
        message: 'No real scrapers available',
        error: 'Real scrapers not initialized',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Error running scrapers:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Run single scraper
app.post('/api/scrapers/:name/run', async (req, res) => {
  try {
    const { name } = req.params;
    
    // Only use real scrapers - no fallbacks
    if (scraperManager) {
      try {
        console.log(`🔄 Running real scraper: ${name}`);
        const result = await scraperManager.runSingleScraper(name);
        res.json({
          success: true,
          message: `${name} real scraper completed`,
          result,
          timestamp: new Date().toISOString(),
          mode: 'real-scraper'
        });
        return;
      } catch (error) {
        console.error(`❌ Real scraper ${name} failed:`, error.message);
        res.status(500).json({
          success: false,
          message: `Real scraper ${name} failed`,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        return;
      }
    }
    
    // No real scrapers available
    console.log(`🚫 No real scraper available for: ${name}`);
    res.status(503).json({
      success: false,
      message: `No real scraper available for ${name}`,
      error: 'Real scrapers not initialized',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ Error running scraper ${req.params.name}:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to run scraper: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Enhanced scraping service error:', error);
  res.status(500).json({ 
    error: 'Internal enhanced scraping service error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down enhanced scraping service gracefully...');
  if (scraperManager) scraperManager.close();
  if (db) db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down enhanced scraping service gracefully...');
  if (scraperManager) scraperManager.close();
  if (db) db.close();
  process.exit(0);
});

// Start service
async function startService() {
  console.log('🚀 Starting SF Dashboard Enhanced Scraping Service...');
  
  // Initialize local scrapers after imports are loaded
  await initializeLocalScrapers();
  
  // Try to initialize real scrapers
  const realScrapersAvailable = await initializeRealScrapers();
  
  app.listen(PORT, () => {
    console.log(`🚀 SF Dashboard Enhanced Scraping Service running on port ${PORT}`);
    console.log(`🌐 API available at: http://localhost:${PORT}`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
    
    if (realScrapersAvailable) {
      console.log(`🔍 Real scrapers active: ${scraperManager.scrapers.size} available`);
      console.log(`📊 Database: Connected to real event database`);
      console.log(`🎯 Mode: REAL SCRAPING (your actual scrapers)`);
    } else {
      console.log(`⚠️ Real scrapers unavailable, using sample data`);
      console.log(`🎯 Mode: SAMPLE DATA (enhance with real scrapers)`);
    }
    
    console.log(`📊 Sample events: http://localhost:${PORT}/api/events`);
  });

  // Auto-run scrapers every 6 hours (only if real scrapers are available)
  if (realScrapersAvailable) {
    setInterval(async () => {
      console.log('⏰ Auto-running real scrapers...');
      try {
        await scraperManager.runAllScrapers();
      } catch (error) {
        console.error('Auto-scraper run failed:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 hours
  }
}

startService().catch(error => {
  console.error('Failed to start enhanced scraping service:', error);
  process.exit(1);
});

export default app;
