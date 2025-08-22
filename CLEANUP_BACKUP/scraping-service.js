#!/usr/bin/env node

/**
 * SF Dashboard Scraping Service
 * 
 * This service runs independently to avoid Puppeteer-Electron conflicts.
 * It uses your existing scrapers and serves data via HTTP API.
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import EventDatabase from './backend/database.js';
import ScraperManager from './backend/scraper-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.SCRAPING_PORT || 3002; // Different port to avoid conflicts

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database and scraper manager
let db, scraperManager;

async function initializeService() {
  try {
    console.log('📊 Initializing scraping service...');
    
    // Initialize database
    db = new EventDatabase();
    await db.init();
    
    // Initialize scraper manager
    scraperManager = new ScraperManager();
    
    console.log('✅ Scraping service initialization complete');
    console.log(`🔍 Available scrapers: ${scraperManager.scrapers.size}`);
    
  } catch (error) {
    console.error('❌ Failed to initialize scraping service:', error);
    process.exit(1);
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'sf-dashboard-scraping',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    scrapers: scraperManager ? scraperManager.scrapers.size : 0
  });
});

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    const { source, category, limit } = req.query;
    
    const filters = {};
    if (source) filters.source = source;
    if (category) filters.category = category;
    if (limit) filters.limit = parseInt(limit);

    const events = await db.getEvents(filters);
    res.json(events);
    
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get events by source
app.get('/api/events/:source', async (req, res) => {
  try {
    const { source } = req.params;
    const { limit } = req.query;
    const events = await db.getEventsBySource(source, limit ? parseInt(limit) : 50);
    res.json(events);
    
  } catch (error) {
    console.error(`Error fetching events for ${req.params.source}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Get all scrapers
app.get('/api/scrapers', async (req, res) => {
  try {
    const scrapers = await db.getScrapers();
    res.json(scrapers);
    
  } catch (error) {
    console.error('Error fetching scrapers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get scraper status
app.get('/api/scrapers/status', async (req, res) => {
  try {
    const status = await scraperManager.getScraperStatus();
    res.json(status);
    
  } catch (error) {
    console.error('Error fetching scraper status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Run all scrapers
app.post('/api/scrapers/run-all', async (req, res) => {
  try {
    console.log('🚀 Manual scraper run requested');
    const results = await scraperManager.runAllScrapers();
    
    res.json({ 
      success: true, 
      message: 'All scrapers completed',
      results,
      timestamp: new Date().toISOString()
    });
    
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
    console.log(`🚀 Manual run requested for ${name}`);
    
    const result = await scraperManager.runSingleScraper(name);
    res.json({ 
      success: true, 
      message: `${name} scraper completed`,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`Error running ${req.params.name} scraper:`, error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get scraper logs
app.get('/api/scrapers/:name/logs', async (req, res) => {
  try {
    const { name } = req.params;
    const { limit } = req.query;
    const logs = await db.getScrapers(name, limit ? parseInt(limit) : 100);
    res.json(logs);
    
  } catch (error) {
    console.error(`Error fetching logs for ${req.params.name}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Scraping service error:', error);
  res.status(500).json({ 
    error: 'Internal scraping service error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down scraping service gracefully...');
  if (scraperManager) scraperManager.close();
  if (db) db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down scraping service gracefully...');
  if (scraperManager) scraperManager.close();
  if (db) db.close();
  process.exit(0);
});

// Start service
async function startService() {
  await initializeService();
  
  app.listen(PORT, () => {
    console.log(`🚀 SF Dashboard Scraping Service running on port ${PORT}`);
    console.log(`📊 Database initialized at: ${process.env.HOME || process.env.USERPROFILE || '.'}/.around-town-dashboard.db`);
    console.log(`🔍 Scrapers ready: ${scraperManager.scrapers.size} available`);
    console.log(`🌐 API available at: http://localhost:${PORT}`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
  });

  // Auto-run scrapers every 6 hours
  setInterval(async () => {
    console.log('⏰ Auto-running scrapers...');
    try {
      await scraperManager.runAllScrapers();
    } catch (error) {
      console.error('Auto-scraper run failed:', error);
    }
  }, 6 * 60 * 60 * 1000); // 6 hours
}

startService().catch(error => {
  console.error('Failed to start scraping service:', error);
  process.exit(1);
});

export default app;
