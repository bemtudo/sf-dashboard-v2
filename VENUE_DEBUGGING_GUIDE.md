# 🎯 SF Dashboard Venue-by-Venue Debugging Guide

## 🚨 **Current Issues Found:**

### **1. Database Connection Problems**
- `this.db.run is undefined` - Database connection issues
- Service crashes after inserting events

### **2. URL/Website Structure Issues**
- **GAMH**: `/events` URL returns "Page not found" (301 redirect)
- **Punchline**: Working but poor data quality (null dates, generic descriptions)

### **3. Scraper Compatibility**
- Fixed: `page.waitForTimeout()` → `setTimeout()` for Puppeteer v24
- Need to test each scraper individually

## 🔍 **Venue-by-Venue Testing Plan**

### **Phase 1: Test Each Venue Individually**
```bash
# Test each scraper one by one
curl -X POST http://localhost:3002/api/scrapers/VENUE_NAME/run

# Check results
curl http://localhost:3002/api/events/VENUE_NAME
```

### **Phase 2: Fix URL Issues**
Many venues have changed their websites. Need to:
1. **Verify current URLs** work
2. **Update scraper selectors** for current HTML structure
3. **Test data quality** (dates, descriptions, prices)

### **Phase 3: Improve Data Quality**
- **Date parsing**: Many events show `null` dates
- **Description quality**: Generic descriptions like "Comedy show at Punchline"
- **Price extraction**: Most prices are empty
- **Image URLs**: Missing event images

## 📊 **Venue Status Dashboard**

| Venue | Status | Issues | Data Quality | Next Steps |
|-------|--------|--------|--------------|------------|
| **punchline** | ✅ Working | Poor data quality | Low | Fix selectors, date parsing |
| **gamh** | ❌ URL Wrong | 301 redirect, page not found | None | Find correct events URL |
| **sfpl** | ✅ Working | Poor selectors, navigation content | Very Low | Fix CSS selectors, filter real events |
| **chapel** | ❓ Untested | Unknown | Unknown | Test scraper |
| **roxie** | ❓ Untested | Unknown | Unknown | Test scraper |
| **cobbs** | ❓ Untested | Unknown | Unknown | Test scraper |

## 🛠️ **Immediate Actions Needed:**

### **1. Fix Database Connection**
The service crashes after inserting events. Need to investigate:
- Database connection pooling
- Error handling in database operations
- Service restart after crashes

### **2. Test Each Venue**
```bash
# Restart service
./start-enhanced-service.sh

# Test venues one by one
curl -X POST http://localhost:3002/api/scrapers/sfpl/run
curl -X POST http://localhost:3002/api/scrapers/chapel/run
curl -X POST http://localhost:3002/api/scrapers/roxie/run
```

### **3. Fix URL Issues**
- **GAMH**: Find correct events page URL
- **Other venues**: Verify URLs still work
- **Update configs** with correct URLs

### **4. Improve Scraper Quality**
- **Date parsing**: Better regex patterns for various date formats
- **Content extraction**: More specific CSS selectors
- **Error handling**: Graceful fallbacks when selectors fail

## 🎯 **Success Criteria**

**A venue is "working" when:**
- ✅ Scraper runs without errors
- ✅ Returns real events (not navigation/marketing content)
- ✅ Events have meaningful titles and descriptions
- ✅ Dates are properly parsed
- ✅ Events are stored in database
- ✅ Dashboard can display events

## 🚀 **Next Steps**

1. **Restart enhanced service**
2. **Test 3-5 venues** individually
3. **Document specific issues** for each venue
4. **Fix URL and selector issues** one by one
5. **Improve data quality** systematically

## 📝 **Testing Commands**

```bash
# Health check
curl http://localhost:3002/health

# Test individual scraper
curl -X POST http://localhost:3002/api/scrapers/VENUE_NAME/run

# Check scraper results
curl http://localhost:3002/api/events/VENUE_NAME

# Check all events
curl http://localhost:3002/api/events

# Scraper status
curl http://localhost:3002/api/scrapers/status
```

---

**Goal**: Get at least 5-10 venues working with high-quality data before moving to production deployment.
