# 🧪 Backend Integration Test Guide

## 🎯 What We're Testing

Your dashboard now has **hybrid scraping**:
1. **Backend First**: Tries to fetch from your existing scrapers via API
2. **Browser Fallback**: Falls back to browser scraping if backend unavailable
3. **Seamless Integration**: Works with your existing scraper infrastructure

## 🚀 Step-by-Step Testing

### Step 1: Start Your Backend

**Option A: Use the startup script**
```bash
./start-backend.sh
```

**Option B: Manual backend start**
```bash
cd "/Users/bem/Library/CloudStorage/GoogleDrive-ben@sidekickvideo.com/My Drive/Vibecoding/dashboard-vite/backend"
npm install  # if needed
npm run dev  # or npm start
```

**Expected Output:**
```
🚀 Around Town Dashboard backend running on port 3000
📊 Database initialized at: /Users/bem/.around-town-dashboard.db
🔍 Scrapers ready: 15 available
```

### Step 2: Test Backend API

**Check if backend is running:**
```bash
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-XX...",
  "uptime": 123.45
}
```

**Check available scrapers:**
```bash
curl http://localhost:3000/api/scrapers
```

**Expected Response:**
```json
[
  {"name": "punchline", "enabled": true, "lastRun": "..."},
  {"name": "sfpl", "enabled": true, "lastRun": "..."},
  // ... more scrapers
]
```

### Step 3: Start Your Dashboard

**In a new terminal:**
```bash
./start-dashboard.sh
```

**Or manually:**
```bash
npm run build
npm run start
```

**Dashboard will be available at:** `http://localhost:3000`

### Step 4: Test the Integration

1. **Open your dashboard** at `http://localhost:3000`
2. **Click "Refresh Events"** button
3. **Watch the browser console** for integration messages

**Expected Console Output:**
```
EventScraper: Starting to scrape events...
🔄 Attempting to fetch from backend API...
📊 Backend returned 45 events
✅ Backend returned 45 events
```

**If Backend is NOT running:**
```
EventScraper: Starting to scrape events...
🔄 Attempting to fetch from backend API...
⚠️ Backend not available, falling back to browser scraping...
🌐 Using browser scraping as fallback...
🌐 Browser scraping Punchline Comedy Club...
🌐 Browser scraping completed: 12 events found
```

## 🔍 What to Look For

### ✅ Success Indicators

- **Backend Connected**: Console shows "Backend returned X events"
- **Real Data**: Events from Punchline, SFPL, GAMH, etc.
- **Proper Categories**: Events organized by comedy, education, music, etc.
- **Fast Loading**: Events appear quickly (from database)

### ⚠️ Fallback Indicators

- **Backend Unavailable**: Console shows "falling back to browser scraping"
- **Sample Data**: Events show "Sample event at [Venue] - real data will appear when backend is connected"
- **Slower Loading**: Takes time to scrape each website

### ❌ Error Indicators

- **CORS Errors**: "Failed to fetch" in console
- **Network Errors**: "Backend not available" messages
- **Scraping Failures**: Individual venue scraping errors

## 🛠️ Troubleshooting

### Backend Won't Start

**Check dependencies:**
```bash
cd "/Users/bem/Library/CloudStorage/GoogleDrive-ben@sidekickvideo.com/My Drive/Vibecoding/dashboard-vite/backend"
npm install
```

**Check port conflicts:**
```bash
lsof -i :3000
# Kill any conflicting processes
```

### Dashboard Can't Connect

**Check backend URL:**
- Dashboard tries to connect to `http://localhost:3000`
- Make sure backend is running on port 3000
- Check firewall/security settings

**Test API manually:**
```bash
curl http://localhost:3000/api/events
```

### Scraping Issues

**Check scraper logs:**
```bash
curl http://localhost:3000/api/scrapers/status
```

**Run scrapers manually:**
```bash
curl -X POST http://localhost:3000/api/scrapers/run-all
```

## 🎯 Expected Results

### With Backend Running
- **Fast loading** (events from database)
- **Real event data** from all 15+ scrapers
- **Proper categorization** and venue organization
- **Rich event details** (titles, dates, descriptions, prices)

### Without Backend
- **Fallback events** for each venue
- **Browser scraping** attempts (may be limited by CORS)
- **Sample data** with helpful messages
- **Functional dashboard** ready for backend connection

## 🚀 Next Steps After Testing

1. **Verify Integration**: Confirm backend events appear in dashboard
2. **Test Scraping**: Run scrapers manually to populate database
3. **Deploy**: Set up production backend and frontend
4. **Monitor**: Watch for scraping errors and performance issues

## 🎉 Success Criteria

Your integration is working when:
- ✅ Backend starts without errors
- ✅ Dashboard connects to backend API
- ✅ Real events appear in dashboard
- ✅ Events are properly categorized
- ✅ Fallback works when backend unavailable

**Ready to test? Run `./start-backend.sh` and then `./start-dashboard.sh`!** 🚀
