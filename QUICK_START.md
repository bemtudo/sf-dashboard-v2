# 🚀 SF Dashboard - Quick Start Guide

## 🎯 What You Have Now

✅ **Real Web Scraping**: Integrated scraping for actual SF venue websites  
✅ **Production Ready**: Can be deployed and run without terminal  
✅ **Real Data**: Scrapes events from comedy clubs, libraries, music venues, etc.  
✅ **Modern UI**: Responsive dashboard with dark/light mode  
✅ **Backend Ready**: Integration points for your existing Node.js scrapers  

## 🌐 Access Your Dashboard

### Development Mode (with hot reload)
```bash
npm run dev
# Open: http://localhost:5173
```

### Production Mode (deployed)
```bash
npm run build
npm run start
# Open: http://localhost:3000
```

## 🚀 One-Click Startup

**Option 1: Use the startup script**
```bash
./start-dashboard.sh
```

**Option 2: Manual commands**
```bash
npm install
npm run build
npm run start
```

## 📊 Real Event Data Sources

The dashboard now scrapes these real SF venues:

- **🎭 Comedy**: Punchline Comedy Club, Cobb's Comedy Club
- **📚 Education**: San Francisco Public Library
- **🎵 Music**: Great American Music Hall, The Chapel, APE Concerts
- **🏃 Sports**: Strava SF Club, Cycling Groups SF
- **🍽️ Food**: Ferry Building, Off the Grid
- **💻 Tech**: Tech Meetups SF

## 🔄 How to Get Real Events

1. **Click "Refresh Events"** in the dashboard
2. **Watch the console** for scraping progress
3. **Events will appear** organized by venue and category
4. **Data persists** in your browser's IndexedDB

## 🚨 Important Notes

- **CORS Limitations**: Some venues may block direct scraping
- **Rate Limiting**: Be respectful of venue websites
- **Data Accuracy**: Event details depend on venue website structure
- **Fallback Data**: Shows sample events when scraping fails

## 🔗 Backend Integration (Optional)

**For full power**, integrate your existing Node.js scrapers:

```bash
# Navigate to your backend folder
cd "/Users/bem/Library/CloudStorage/GoogleDrive-ben@sidekickvideo.com/My Drive/Vibecoding/dashboard-vite/backend"

# Set up backend API
npm init -y
npm install express cors puppeteer cheerio
```

**See `BACKEND_INTEGRATION.md` for complete setup instructions.**

## 🌍 Deploy to the Web (No Terminal Needed)

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repo to [vercel.com](https://vercel.com)
3. Auto-deploys on every push

### Netlify
1. Run `npm run build`
2. Drag `dist` folder to [netlify.com](https://netlify.com)
3. Get instant live URL

### GitHub Pages
1. Run `npm run build`
2. Set up GitHub Actions for auto-deploy
3. Available at `username.github.io/reponame`

## 🛠️ Customize Scraping

**Add new venues** in `src/utils/EventScraper.ts`:
```typescript
this.websites.comedy.push({
  url: 'https://newcomedyclub.com/events',
  category: 'comedy',
  venue: 'New Comedy Club'
});
```

**Modify scraping logic** for specific venues:
```typescript
private parseEventDetails(html: string, venue: string, category: string) {
  // Add venue-specific parsing logic here
}
```

## 📱 Features

- **Real-time Scraping**: Live event data from venue websites
- **Smart Organization**: Events grouped by venue within categories
- **Date Filtering**: Today, Tomorrow, This Weekend
- **Responsive Design**: Works on all devices
- **Dark/Light Mode**: Toggle themes
- **Local Storage**: Events persist between sessions
- **Today's Ticker**: Horizontal scrolling events ticker

## 🎉 You're All Set!

Your SF Dashboard now:
- ✅ Scrapes real event data from actual venues
- ✅ Can run without the terminal (production mode)
- ✅ Is ready for web deployment
- ✅ Has integration points for your existing scrapers
- ✅ Has a modern, responsive interface

**Next steps:**
1. Test the real scraping by clicking "Refresh Events"
2. Deploy to Vercel/Netlify for web access
3. **Optional**: Set up backend integration for full scraper power
4. Customize venue sources as needed
5. Monitor scraping performance and adjust as needed

**For backend integration**, see `BACKEND_INTEGRATION.md` for complete instructions on using your existing Puppeteer + Cheerio scrapers.

Enjoy your real-time SF event dashboard! 🚀
