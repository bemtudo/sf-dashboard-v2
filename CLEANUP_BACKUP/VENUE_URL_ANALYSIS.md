# 🌐 SF Dashboard Venue URL Analysis

## 📊 **All 15 Venue URLs Your Scrapers Are Targeting**

### **🎭 Comedy & Entertainment Venues**

| Venue | URL | Status | Issues | Last Test |
|-------|-----|--------|--------|-----------|
| **punchline** | `https://www.punchlinecomedyclub.com/events` | ✅ **Working** | Poor data quality | 2025-08-18 22:03:56 |
| **cobbs** | `https://www.cobbscomedy.com/events` | ❓ **Untested** | Unknown | Never run |
| **knockout** | `https://www.theknockoutsf.com/events` | ❓ **Untested** | Unknown | Never run |

### **🎵 Music Venues**

| Venue | URL | Status | Issues | Last Test |
|-------|-----|--------|--------|-----------|
| **gamh** | `https://www.gamh.com/events` | ❌ **Broken** | 301 redirect → "Page not found" | 2025-08-18 22:07:28 |
| **chapel** | `https://www.thechapelsf.com/events` | ❓ **Untested** | Unknown | Never run |
| **ape** | `https://www.apeconcerts.com/events` | ❓ **Untested** | Unknown | Never run |
| **grizzlypeak** | `https://www.grizzlypeakbrewing.com/events` | ❓ **Untested** | Unknown | Never run |

### **🎬 Film & Arts**

| Venue | URL | Status | Issues | Last Test |
|-------|-----|--------|--------|-----------|
| **roxie** | `https://www.roxie.com/now-playing` | ❓ **Untested** | Unknown | Never run |

### **📚 Education & Culture**

| Venue | URL | Status | Issues | Last Test |
|-------|-----|--------|--------|-----------|
| **sfpl** | `https://sfpl.org/events` | ✅ **Working** | Poor selectors (navigation content) | 2025-08-18 22:09:01 |
| **commonwealth** | `https://www.commonwealthclub.org/events` | ❓ **Untested** | Unknown | Never run |
| **creativemornings** | `https://creativemornings.com/cities/sf` | ❓ **Untested** | Unknown | Never run |

### **🍽️ Food & Drink**

| Venue | URL | Status | Issues | Last Test |
|-------|-----|--------|--------|-----------|
| **cafedunord** | `https://www.cafedunord.com/events` | ❓ **Untested** | Unknown | Never run |

### **📖 Books & Literature**

| Venue | URL | Status | Issues | Last Test |
|-------|-----|--------|--------|-----------|
| **booksmith** | `https://www.booksmith.com/events` | ❓ **Untested** | Unknown | Never run |

### **🏃 Sports & Fitness**

| Venue | URL | Status | Issues | Last Test |
|-------|-----|--------|--------|-----------|
| **strava** | `https://www.strava.com/clubs` | ❓ **Untested** | Unknown | Never run |

### **🎪 Other**

| Venue | URL | Status | Issues | Last Test |
|-------|-----|--------|--------|-----------|
| **sfrando** | `https://www.sfrando.org/events` | ❓ **Untested** | Unknown | Never run |

## 🚨 **Critical URL Issues Found**

### **1. GAMH - Great American Music Hall**
- **Current URL**: `https://www.gamh.com/events`
- **Problem**: 301 redirect → "Page not found"
- **What's happening**: The `/events` path doesn't exist
- **Need to find**: Correct events page URL

### **2. Working but Poor Quality**
- **punchline**: Working but generic descriptions, no dates
- **sfpl**: Working but mostly navigation elements (111 events, mostly useless)

## 🔍 **URL Testing Results**

### **❌ Broken URLs Found:**

| Venue | URL | Problem | Status |
|-------|-----|---------|--------|
| **gamh** | `https://www.gamh.com/events` | 301 redirect → "Page not found" | ❌ Broken |
| **cobbs** | `https://www.cobbscomedy.com/events` | 404 error → "This page could not be found" | ❌ Broken |
| **roxie** | `https://www.roxie.com/now-playing` | 301 redirect (nginx) | ❌ Broken |
| **chapel** | `https://www.thechapelsf.com/events` | No response/empty | ❌ Broken |

### **✅ Working URLs:**

| Venue | URL | Status | Data Quality |
|-------|-----|--------|--------------|
| **punchline** | `https://www.punchlinecomedyclub.com/events` | ✅ Working | Poor (generic descriptions, no dates) |
| **sfpl** | `https://sfpl.org/events` | ✅ Working | Very Poor (mostly navigation elements) |

### **❓ Untested URLs (Need to verify):**

| Venue | URL | Expected Status |
|-------|-----|-----------------|
| **ape** | `https://www.apeconcerts.com/events` | Unknown |
| **grizzlypeak** | `https://www.grizzlypeakbrewing.com/events` | Unknown |
| **knockout** | `https://www.theknockoutsf.com/events` | Unknown |
| **commonwealth** | `https://www.commonwealthclub.org/events` | Unknown |
| **creativemornings** | `https://creativemornings.com/cities/sf` | Unknown |
| **cafedunord** | `https://www.cafedunord.com/events` | Unknown |
| **booksmith** | `https://www.booksmith.com/events` | Unknown |
| **strava** | `https://www.strava.com/clubs` | Unknown |
| **sfrando** | `https://www.sfrando.org/events` | Unknown |

## 🚨 **Critical Findings:**

**Out of 15 venues, only 2 are working:**
- **13 venues** have broken URLs or need testing
- **2 venues** work but have poor data quality
- **0 venues** are working with good data quality

## 🔧 **Immediate Actions Needed:**

1. **Fix broken URLs** - Find correct event pages for broken venues
2. **Test untested URLs** - Verify which ones actually work
3. **Improve working scrapers** - Fix CSS selectors and date parsing
4. **Find alternative venues** - Replace completely broken ones
