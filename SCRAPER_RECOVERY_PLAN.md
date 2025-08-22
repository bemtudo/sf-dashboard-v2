# 🚀 SF Dashboard V2 - Scraper Recovery Plan

## 📊 **Current Status Summary**

### ✅ **WORKING SCRAPERS (Leave Alone!)**
- **Roxie** ✅ (95 events - RSS feed approach, restored and working)
- **Chapel** ✅ (7 events - fixed import and parsing)
- **Green Apple Books** ✅ (4 events - fixed selectors and date parsing)
- **GAMH** ✅ (12 events - **FIXED date parsing from SeeTickets structure**)

### 🔧 **SCRAPERS THAT NEED ATTENTION**
- **SFPL** ⏸️ (Complex Drupal Views + AJAX - deferred for now)
- **Booksmith** ⏸️ (Iframe events from gopassage.com - deferred)
- **Valkyries** ⏸️ (Website redirect to lander page - deferred)

### 📋 **COMPLETED TASKS**
- [x] Fix GAMH date parsing issue (all events at 5 PM)
- [x] Fix Chapel scraper - Extract real events from calendar structure
- [x] Fix Green Apple Books scraper - Selector and date parsing issues
- [x] Restore Roxie scraper - Use RSS feed approach instead of broken calendar parsing

## 🎯 **NEXT PRIORITIES**

### **Phase 1: Complete Remaining Simple Fixes**
1. **Booksmith** - Investigate iframe events from gopassage.com
2. **Valkyries** - Check if website is back online or find alternative

### **Phase 2: Complex Challenges**
1. **SFPL** - Investigate Drupal Views AJAX system (when time permits)

## 🏗️ **FRONTEND INTEGRATION PLAN**

### **Current Architecture**
- **Backend**: `simple-backend-service.js` running on port 3002
- **Frontend**: React dashboard on port 5173
- **Communication**: REST API endpoints

### **Integration Strategy**
1. **Main Events Endpoint**: `/api/events` - returns all working scrapers
2. **Individual Testing**: `/api/test/{scraper-name}` - for debugging
3. **Health Check**: `/health` - service status

### **Frontend Connection Points**
- Connect to `http://localhost:3002/api/events`
- Display events grouped by source/venue
- Real-time updates via periodic API calls
- Error handling for failed scrapers

## 📝 **NOTES**
- **GAMH**: Now parsing real dates from SeeTickets structure (Fri Aug 22, Sat Aug 23, etc.)
- **Roxie**: Using RSS feed approach for reliability
- **Chapel**: Fixed Cheerio import and date parsing
- **Green Apple**: Fixed selectors and date validation

---
*Last Updated: GAMH scraper fixed - now returns 12 real events with correct dates and times*
