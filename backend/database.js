import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EventDatabase {
  constructor() {
    // Store database in user's home directory for persistence
    const dbPath = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.around-town-dashboard.db');
    this.db = new sqlite3.Database(dbPath);
    // Removed this.init() - will be called explicitly by the service
  }

  init() {
    return new Promise((resolve, reject) => {
      // Create tables if they don't exist
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          date_start DATETIME,
          date_end DATETIME,
          location TEXT,
          source TEXT NOT NULL,
          source_url TEXT,
          category TEXT,
          price TEXT,
          image_url TEXT,
          film_url TEXT,
          screen TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS scrapers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          enabled BOOLEAN DEFAULT 1,
          last_run DATETIME,
          last_success DATETIME,
          error_count INTEGER DEFAULT 0,
          last_error TEXT,
          config TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS scraper_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          scraper_name TEXT NOT NULL,
          status TEXT NOT NULL,
          message TEXT,
          events_found INTEGER DEFAULT 0,
          duration_ms INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_events_date ON events(date_start);
        CREATE INDEX IF NOT EXISTS idx_events_source ON events(source);
        CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          this.insertDefaultScrapers().then(resolve).catch(reject);
        }
      });
    });
  }

  insertDefaultScrapers() {
    return new Promise((resolve, reject) => {
      const defaultScrapers = [
        // Music Venues
        { name: 'chapel', enabled: 1, config: JSON.stringify({ url: 'https://www.thechapelsf.com/events' }) },
        { name: 'gamh', enabled: 1, config: JSON.stringify({ url: 'https://www.gamh.com/events' }) },
        { name: 'knockout', enabled: 1, config: JSON.stringify({ url: 'https://www.theknockoutsf.com/events' }) },
        { name: 'cafedunord', enabled: 1, config: JSON.stringify({ url: 'https://www.cafedunord.com/events' }) },
        { name: 'ape', enabled: 1, config: JSON.stringify({ url: 'https://apeconcerts.com/calendar/' }) },
        
        // Film
        { name: 'roxie', enabled: 1, config: JSON.stringify({ url: 'https://www.roxie.com/now-playing' }) },
        { name: 'balboa', enabled: 1, config: JSON.stringify({ url: 'https://www.balboamovies.com/calendar' }) },
        
        // Biking & Fitness
        { name: 'sfrando', enabled: 1, config: JSON.stringify({ url: 'https://www.sfrando.org/events' }) },
        { name: 'grizzlypeak', enabled: 1, config: JSON.stringify({ url: 'https://www.grizzlypeakbrewing.com/events' }) },
        { name: 'strava', enabled: 1, config: JSON.stringify({ url: 'https://www.strava.com/clubs' }) },
        
        // Comedy
        { name: 'punchline', enabled: 1, config: JSON.stringify({ url: 'https://www.punchlinecomedyclub.com/events' }) },
        { name: 'cobbs', enabled: 1, config: JSON.stringify({ url: 'https://www.cobbscomedy.com/events' }) },
        
        // Creative & Learning
        { name: 'creativemornings', enabled: 1, config: JSON.stringify({ url: 'https://creativemornings.com/cities/sf' }) },
        { name: 'booksmith', enabled: 1, config: JSON.stringify({ url: 'https://www.booksmith.com/events' }) },
        
        // Education & Talks
        { name: 'sfpl', enabled: 1, config: JSON.stringify({ url: 'https://sfpl.org/events' }) },
        { name: 'commonwealth', enabled: 1, config: JSON.stringify({ url: 'https://www.commonwealthclub.org/events' }) },
        
        // Sports
        { name: 'sfcityfc', enabled: 1, config: JSON.stringify({ url: 'https://www.sfcityfc.com/schedule' }) },
        { name: 'oaklandroots', enabled: 1, config: JSON.stringify({ url: 'https://www.oaklandrootssc.com/wp-json/tribe/events/v1/events/' }) },
        { name: 'warriors', enabled: 1, config: JSON.stringify({ url: 'https://data.nba.com/data/10s/v2015/json/mobile_teams/nba/2024/teams/warriors/schedule.json' }) },
        { name: 'valkyries', enabled: 1, config: JSON.stringify({ url: 'https://data.wnba.com/data/10s/v2015/json/mobile_teams/wnba/2024/teams/valkyries/schedule.json' }) },
        { name: 'giants', enabled: 1, config: JSON.stringify({ url: 'https://statsapi.mlb.com/api/v1/schedule/games/?sportId=1&teamId=137&startDate=2025-08-01&endDate=2025-12-31' }) }
      ];

      let completed = 0;
      const total = defaultScrapers.length;

      defaultScrapers.forEach(scraper => {
        this.db.run(`
          INSERT OR IGNORE INTO scrapers (name, enabled, config) 
          VALUES (?, ?, ?)
        `, [scraper.name, scraper.enabled, scraper.config], (err) => {
          if (err) {
            console.warn(`Warning: Could not insert scraper ${scraper.name}:`, err.message);
          }
          completed++;
          if (completed === total) {
            resolve();
          }
        });
      });
    });
  }

  // Event methods
  insertEvent(event) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO events 
        (title, description, date_start, date_end, location, source, source_url, category, price, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        event.title,
        event.description,
        event.date_start,
        event.date_end,
        event.location,
        event.source,
        event.source_url,
        event.category,
        event.price,
        event.image_url
      ], function(err) {
        if (err) {
          console.error('Error inserting event:', err);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });

      stmt.finalize();
    });
  }

  getEvents(filters = {}) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM events WHERE 1=1';
      const params = [];

      if (filters.source) {
        query += ' AND source = ?';
        params.push(filters.source);
      }

      if (filters.category) {
        query += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters.dateFrom) {
        query += ' AND date_start >= ?';
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        query += ' AND date_start <= ?';
        params.push(filters.dateTo);
      }

      if (filters.search) {
        query += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      query += ' ORDER BY date_start ASC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  getEventsBySource(source, limit = 50) {
    return this.getEvents({ source, limit });
  }

  // Scraper methods
  updateScraperStatus(name, status, message = null, eventsFound = 0, duration = 0) {
    return new Promise((resolve, reject) => {
      const self = this; // Store reference to 'this'
      this.db.run(`
        UPDATE scrapers 
        SET last_run = CURRENT_TIMESTAMP,
            last_success = CASE WHEN ? = 'success' THEN CURRENT_TIMESTAMP ELSE last_success END,
            error_count = CASE WHEN ? = 'error' THEN error_count + 1 ELSE error_count END,
            last_error = CASE WHEN ? = 'error' THEN ? ELSE last_error END
        WHERE name = ?
      `, [status, status, status, message, name], function(err) {
        if (err) {
          reject(err);
        } else {
          // Log the run - use 'self' instead of 'this'
          self.db.run(`
            INSERT INTO scraper_logs (scraper_name, status, message, events_found, duration_ms)
            VALUES (?, ?, ?, ?, ?)
          `, [name, status, message, eventsFound, duration], (logErr) => {
            if (logErr) {
              console.warn('Warning: Could not log scraper run:', logErr.message);
            }
            resolve();
          });
        }
      });
    });
  }

  getScrapers() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM scrapers ORDER BY name', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  getScraperLogs(scraperName = null, limit = 100) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM scraper_logs';
      const params = [];

      if (scraperName) {
        query += ' WHERE scraper_name = ?';
        params.push(scraperName);
      }

      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Utility methods
  getStats() {
    return new Promise((resolve, reject) => {
      Promise.all([
        this.runQuery('SELECT COUNT(*) as count FROM events'),
        this.runQuery('SELECT COUNT(*) as count FROM scrapers'),
        this.runQuery('SELECT COUNT(*) as count FROM scrapers WHERE enabled = 1')
      ]).then(([eventCount, scraperCount, enabledScrapers]) => {
        resolve({
          totalEvents: eventCount[0].count,
          totalScrapers: scraperCount[0].count,
          enabledScrapers: enabledScrapers[0].count
        });
      }).catch(reject);
    });
  }

  // 🗑️ Clear all events from database
  clearAllEvents() {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM events', (err) => {
        if (err) {
          reject(err);
        } else {
          // Reset auto-increment counter
          this.db.run('DELETE FROM sqlite_sequence WHERE name = "events"', (seqErr) => {
            if (seqErr) {
              console.warn('Warning: Could not reset sequence counter:', seqErr.message);
            }
            resolve();
          });
        }
      });
    });
  }

  runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close() {
    this.db.close();
  }
}

export default EventDatabase;
