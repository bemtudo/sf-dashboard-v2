# 🔗 Backend Integration Guide

## 🎯 Current Setup

Your dashboard now has **browser-compatible scraping** that works immediately, but for the **full power** of your existing scrapers, you'll want to integrate the backend.

## 📁 Your Existing Scrapers

Located at: `/Users/bem/Library/CloudStorage/GoogleDrive-ben@sidekickvideo.com/My Drive/Vibecoding/dashboard-vite/backend/scrapers/`

**Available Scrapers:**
- `punchline-scraper.js` - Punchline Comedy Club
- `cobbs-scraper.js` - Cobb's Comedy Club  
- `sfpl-scraper.js` - San Francisco Public Library
- `gamh-scraper.js` - Great American Music Hall
- `chapel-scraper.js` - The Chapel
- `ape-scraper.js` - APE Concerts
- `strava-scraper.js` - Strava SF Club
- `sfrando-scraper.js` - SF Rando
- `grizzlypeak-scraper.js` - Grizzly Peak
- `roxie-scraper.js` - Roxie Theater
- `knockout-scraper.js` - Knockout
- `cafedunord-scraper.js` - Cafe du Nord
- `creativemornings-scraper.js` - Creative Mornings
- `booksmith-scraper.js` - Booksmith
- `commonwealth-scraper.js` - Commonwealth Club

## 🚀 Integration Options

### Option 1: Full Backend Integration (Recommended)

**Create a backend API** that runs your scrapers and serves data to the dashboard:

```bash
# In your backend folder
npm init -y
npm install express cors puppeteer cheerio
```

**Create `server.js`:**
```javascript
import express from 'express';
import cors from 'cors';
import { PunchlineScraper } from './scrapers/punchline-scraper.js';
import { SFPLScraper } from './scrapers/sfpl-scraper.js';
// Import other scrapers...

const app = express();
app.use(cors());

app.get('/api/events', async (req, res) => {
  try {
    const scrapers = [
      new PunchlineScraper(),
      new SFPLScraper(),
      // Add other scrapers...
    ];
    
    const allEvents = [];
    for (const scraper of scrapers) {
      const result = await scraper.scrape();
      if (result.success) {
        allEvents.push(...result.events);
      }
    }
    
    res.json(allEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Backend running on port 3001');
});
```

**Update your dashboard** to fetch from the backend:

```typescript
// In EventScraper.ts
async scrapeAllSources(): Promise<Omit<Event, 'id' | 'scrapedAt'>[]> {
  try {
    // Try backend first
    const response = await fetch('http://localhost:3001/api/events');
    if (response.ok) {
      const scrapedEvents = await response.json();
      return this.convertScrapedEvents(scrapedEvents);
    }
  } catch (error) {
    console.log('Backend not available, falling back to browser scraping...');
  }
  
  // Fallback to browser scraping
  return this.browserScrape();
}
```

### Option 2: Hybrid Approach (Current)

**What you have now:**
- ✅ Browser-compatible scraping for immediate use
- ✅ Fallback events when scraping fails
- ✅ Ready for backend integration
- ✅ Works without terminal (production mode)

**Benefits:**
- Dashboard works immediately
- No backend setup required
- Easy to deploy to Vercel/Netlify
- Gradual backend integration

## 🔧 Backend Setup Commands

```bash
# Navigate to your backend folder
cd "/Users/bem/Library/CloudStorage/GoogleDrive-ben@sidekickvideo.com/My Drive/Vibecoding/dashboard-vite/backend"

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express cors puppeteer cheerio

# Install dev dependencies
npm install -D nodemon

# Add scripts to package.json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}

# Start backend
npm run dev
```

## 📊 Data Flow

```
Your Scrapers (Puppeteer + Cheerio)
           ↓
    Backend API (Express)
           ↓
    Dashboard (React + TypeScript)
           ↓
    User Interface
```

## 🎯 Next Steps

1. **Test current setup**: Your dashboard works now with browser scraping
2. **Set up backend**: Follow Option 1 above for full scraper integration
3. **Deploy**: Use Vercel/Netlify for the frontend, your server for the backend
4. **Monitor**: Watch for CORS issues and rate limiting

## 🚨 Important Notes

- **CORS**: Your backend needs to handle CORS for the dashboard
- **Rate Limiting**: Be respectful of venue websites
- **Error Handling**: Scrapers may fail due to website changes
- **Performance**: Puppeteer is resource-intensive, consider caching

## 🎉 You're Ready!

Your dashboard now:
- ✅ Works immediately with browser scraping
- ✅ Has integration points for your existing scrapers
- ✅ Can run without the terminal
- ✅ Is ready for full backend integration

Choose your path and enjoy your real-time SF event dashboard! 🚀
