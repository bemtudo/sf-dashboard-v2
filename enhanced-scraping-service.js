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
    const backendPath = '/Users/bem/Library/CloudStorage/GoogleDrive-ben@sidekickvideo.com/My Drive/Vibecoding/dashboard-vite/backend';
    
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
    
    console.log('✅ Real scrapers initialized successfully');
    console.log(`🔍 Available scrapers: ${scraperManager.scrapers.size}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize real scrapers:', error.message);
    console.log('⚠️ Falling back to working scrapers mode');
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

// No fallback scrapers - only real scrapers
let workingScrapers = {};

function initializeWorkingScrapers() {
  // Disabled - no fallback scrapers
  workingScrapers = {};
  console.log('🚫 Fallback scrapers disabled - only real scrapers allowed');
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
    message: scraperManager ? 'Real scrapers are running!' : 'Using sample data mode'
  });
});

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    // Only use real scrapers - no fallbacks
    if (db && scraperManager) {
      console.log('🔄 Fetching events from real scrapers...');
      try {
        const events = await db.getEvents({});
        if (events && events.length > 0) {
          console.log(`📊 Returning ${events.length} events from real scrapers`);
          res.json(events);
          return;
        } else {
          console.log('📭 No events found in database');
          res.json([]);
          return;
        }
      } catch (error) {
        console.error('❌ Real scrapers failed:', error.message);
        res.status(500).json({ error: 'Real scrapers failed', details: error.message });
        return;
      }
    }
    
    // No real scrapers available
    console.log('🚫 No real scrapers available');
    res.status(503).json({ error: 'No real scrapers available', message: 'Service requires real scrapers to be initialized' });
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
  
  // Initialize working scrapers after imports are loaded
  initializeWorkingScrapers();
  
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
