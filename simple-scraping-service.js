#!/usr/bin/env node

/**
 * Simple SF Dashboard Scraping Service
 * 
 * This is a simplified version that works immediately for testing.
 * It provides sample data and can be enhanced later with your full scrapers.
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Sample event data for testing
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
    date_start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    location: "San Francisco Public Library",
    source: "sfpl",
    source_url: "https://sfpl.org/events",
    category: "Education",
    price: "Free"
  },
  {
    title: "Live Music at GAMH",
    description: "Alternative rock night with local bands",
    date_start: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
    location: "Great American Music Hall",
    source: "gamh",
    source_url: "https://www.gamh.com/events",
    category: "Music",
    price: "$35"
  },
  {
    title: "Cycling Group Ride",
    description: "Weekly group ride through Golden Gate Park",
    date_start: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
    location: "Golden Gate Park",
    source: "strava",
    source_url: "https://www.strava.com/clubs/san-francisco",
    category: "Sports",
    price: "Free"
  },
  {
    title: "Tech Meetup - AI & ML",
    description: "Networking and talks on AI/ML trends",
    date_start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    location: "500 Howard St, San Francisco",
    source: "tech-meetup",
    source_url: "https://www.meetup.com",
    category: "Tech",
    price: "Free"
  }
];

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'sf-dashboard-simple-scraping',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Simple scraping service is running!'
  });
});

// Get all events
app.get('/api/events', (req, res) => {
  try {
    console.log('📊 Returning sample events for testing');
    res.json(sampleEvents);
  } catch (error) {
    console.error('Error returning events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get events by source
app.get('/api/events/:source', (req, res) => {
  try {
    const { source } = req.params;
    const events = sampleEvents.filter(event => event.source === source);
    res.json(events);
  } catch (error) {
    console.error(`Error fetching events for ${req.params.source}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Get all scrapers (simplified)
app.get('/api/scrapers', (req, res) => {
  try {
    const scrapers = [
      { name: 'punchline', enabled: true, lastRun: new Date().toISOString() },
      { name: 'sfpl', enabled: true, lastRun: new Date().toISOString() },
      { name: 'gamh', enabled: true, lastRun: new Date().toISOString() },
      { name: 'strava', enabled: true, lastRun: new Date().toISOString() },
      { name: 'tech-meetup', enabled: true, lastRun: new Date().toISOString() }
    ];
    res.json(scrapers);
  } catch (error) {
    console.error('Error fetching scrapers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get scraper status (simplified)
app.get('/api/scrapers/status', (req, res) => {
  try {
    const status = {
      total: 5,
      enabled: 5,
      disabled: 0,
      lastRun: new Date().toISOString(),
      nextRun: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours from now
    };
    res.json(status);
  } catch (error) {
    console.error('Error fetching scraper status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Run all scrapers (simplified - just returns success)
app.post('/api/scrapers/run-all', (req, res) => {
  try {
    console.log('🚀 Manual scraper run requested (simplified)');
    
    // Simulate running scrapers
    setTimeout(() => {
      console.log('✅ Simulated scraper run completed');
    }, 1000);
    
    res.json({ 
      success: true, 
      message: 'All scrapers completed (simplified mode)',
      results: sampleEvents.map(event => ({
        name: event.source,
        success: true,
        events: [event],
        count: 1,
        duration: 100
      })),
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

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Simple scraping service error:', error);
  res.status(500).json({ 
    error: 'Internal simple scraping service error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down simple scraping service gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down simple scraping service gracefully...');
  process.exit(0);
});

// Start service
app.listen(PORT, () => {
  console.log(`🚀 SF Dashboard Simple Scraping Service running on port ${PORT}`);
  console.log(`🌐 API available at: http://localhost:${PORT}`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Sample events: http://localhost:${PORT}/api/events`);
  console.log(`🔍 This is a simplified service for testing - enhance with your real scrapers later!`);
});

export default app;
