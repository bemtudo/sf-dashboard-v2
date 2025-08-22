// All scrapers are now loaded dynamically from the database
// No static imports needed

class ScraperManager {
  constructor(db) {
    this.db = db;
    this.scrapers = new Map();
    this.isRunning = false;
  }

  async init() {
    await this.initScrapers();
    return this;
  }

  async initScrapers() {
    try {
      // Get the list of enabled scrapers from the database
      const enabledScrapers = await this.db.getScrapers();
      console.log(`ScraperManager: Found ${enabledScrapers.length} scrapers in database`);

      // Dynamically load and instantiate scrapers based on database config
      for (const scraperInfo of enabledScrapers) {
        if (scraperInfo.enabled) {
          try {
            // Dynamically import the scraper file based on its name
            const scraperModule = await import(`./scrapers/${scraperInfo.name}-scraper.js`);
            
            // Handle named exports with proper casing for each scraper
            let className;
            switch (scraperInfo.name) {
              case 'ape': className = 'APEScraper'; break;
              case 'cafedunord': className = 'CafeDuNordScraper'; break;
              case 'creativemornings': className = 'CreativeMorningsScraper'; break;
              case 'gamh': className = 'GAMHScraper'; break;
              case 'grizzlypeak': className = 'GrizzlyPeakScraper'; break;
              case 'sfpl': className = 'SFPLScraper'; break;
              case 'sfrando': className = 'SFRandoScraper'; break;
              default: className = `${scraperInfo.name.charAt(0).toUpperCase() + scraperInfo.name.slice(1)}Scraper`;
            }
            console.log(`🔍 Looking for class '${className}' in module for ${scraperInfo.name}`);
            console.log(`🔍 Available exports:`, Object.keys(scraperModule));
            
            const ScraperClass = scraperModule[className];
            
            if (!ScraperClass) {
              throw new Error(`Could not find scraper class '${className}' for ${scraperInfo.name}`);
            }
            
            console.log(`✅ Found class '${className}' for ${scraperInfo.name}`);
            this.scrapers.set(scraperInfo.name, new ScraperClass());
            console.log(`✅ Loaded scraper: ${scraperInfo.name}`);
          } catch (error) {
            console.warn(`⚠️ Failed to load scraper '${scraperInfo.name}':`, error.message);
          }
        }
      }
      
      console.log(`ScraperManager: Initialized ${this.scrapers.size} scrapers`);
    } catch (error) {
      console.error('ScraperManager: Failed to initialize scrapers from database', error);
      // Fall back to basic initialization - no scrapers available
      console.log('ScraperManager: No scrapers available in fallback mode');
    }
  }

  async runAllScrapers() {
    if (this.isRunning) {
      console.log('⚠️  Scrapers already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting all scrapers...');

    const results = [];
    const startTime = Date.now();

    try {
      // Get enabled scrapers from database
      const enabledScrapers = this.db.getScrapers().filter(s => s.enabled);
      
      console.log(`📊 Found ${enabledScrapers.length} enabled scrapers`);

      // Run scrapers in parallel (but limit concurrency)
      const concurrency = 3; // Run 3 scrapers at a time
      const chunks = this.chunkArray(enabledScrapers, concurrency);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`🔄 Running batch ${i + 1}/${chunks.length} (${chunk.length} scrapers)`);
        
        const chunkPromises = chunk.map(async (scraperInfo) => {
          const scraper = this.scrapers.get(scraperInfo.name);
          if (!scraper) {
            console.warn(`⚠️  No scraper found for ${scraperInfo.name}`);
            return { name: scraperInfo.name, success: false, error: 'Scraper not found' };
          }

          try {
            const result = await scraper.scrape();
            return { name: scraperInfo.name, ...result };
          } catch (error) {
            return { 
              name: scraperInfo.name, 
              success: false, 
              error: error.message,
              events: [],
              count: 0,
              duration: 0
            };
          }
        });

        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);

        // Small delay between batches to be nice to servers
        if (i < chunks.length - 1) {
          await this.sleep(2000);
        }
      }

    } catch (error) {
      console.error('❌ Error running scrapers:', error);
    } finally {
      this.isRunning = false;
    }

    // Process results and update database
    await this.processResults(results);

    const totalDuration = Date.now() - startTime;
    console.log(`✅ All scrapers completed in ${totalDuration}ms`);
    
    return results;
  }

  async processResults(results) {
    console.log('💾 Processing scraper results...');

    for (const result of results) {
      const { name, success, events, count, duration, error } = result;
      
      if (success && events.length > 0) {
        // Insert events into database
        let insertedCount = 0;
        for (const event of events) {
          const eventId = this.db.insertEvent({
            ...event,
            source: name
          });
          if (eventId) insertedCount++;
        }
        
        console.log(`✅ ${name}: ${insertedCount}/${events.length} events inserted`);
        
        // Update scraper status
        this.db.updateScraperStatus(name, 'success', null, insertedCount, duration);
        
      } else {
        // Update scraper status with error
        this.db.updateScraperStatus(name, 'error', error || 'Unknown error', 0, duration);
        console.log(`❌ ${name}: ${error || 'Failed to scrape'}`);
      }
    }
  }

  async runSingleScraper(scraperName) {
    const scraper = this.scrapers.get(scraperName);
    if (!scraper) {
      throw new Error(`Scraper '${scraperName}' not found`);
    }

    console.log(`🔄 Running single scraper: ${scraperName}`);
    
    try {
      const result = await scraper.scrape();
      await this.processResults([{ name: scraperName, ...result }]);
      return result;
    } catch (error) {
      console.error(`❌ Error running ${scraperName}:`, error);
      this.db.updateScraperStatus(scraperName, 'error', error.message, 0, 0);
      throw error;
    }
  }

  getScraperStatus() {
    return this.db.getScrapers();
  }

  getScraperLogs(scraperName = null) {
    return this.db.getScraperLogs(scraperName);
  }

  // Utility methods
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  close() {
    this.db.close();
  }
}

export default ScraperManager;
