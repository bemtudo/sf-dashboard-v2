# SF Dashboard - Complete Cursor Setup Guide

This guide will walk you through setting up SF Dashboard in Cursor IDE step-by-step.

## 📋 Step 1: Create Project Folder

1. **Create a new folder** on your computer called `SF Dashboard`
2. **Copy all files** from the Bolt project into this folder

### Required Files Checklist:
```
SF Dashboard/
├── 📄 package.json
├── 📄 vite.config.ts
├── 📄 tsconfig.json
├── 📄 tsconfig.app.json
├── 📄 tsconfig.node.json
├── 📄 tailwind.config.js
├── 📄 postcss.config.js
├── 📄 eslint.config.js
├── 📄 index.html
├── 📄 .gitignore
├── 📄 README.md
├── 📄 CURSOR_SETUP_GUIDE.md (this file)
└── 📁 src/
    ├── 📄 main.tsx
    ├── 📄 App.tsx
    ├── 📄 index.css
    ├── 📄 vite-env.d.ts
    ├── 📁 types/
    │   └── 📄 Event.ts
    ├── 📁 components/
    │   ├── 📄 EventTicker.tsx
    │   └── 📄 VenueNode.tsx
    └── 📁 utils/
        ├── 📄 EventStorage.ts
        └── 📄 EventScraper.ts
```

## 🚀 Step 2: Open in Cursor

1. **Launch Cursor IDE**
2. **File → Open Folder**
3. **Select** your `SF Dashboard` folder
4. **Wait** for Cursor to load the project

## 📦 Step 3: Install Dependencies

1. **Open terminal** in Cursor (`Terminal → New Terminal` or `Ctrl+` `)
2. **Run installation command**:
   ```bash
   npm install
   ```
3. **Wait** for all packages to install (this may take 1-2 minutes)

### Expected Dependencies:
- React 18 + React DOM
- TypeScript + Vite
- Tailwind CSS + PostCSS + Autoprefixer
- Lucide React (for icons)
- ESLint + TypeScript ESLint

## 🔧 Step 4: Start Development Server

1. **In the terminal**, run:
   ```bash
   npm run dev
   ```
2. **Wait** for the server to start
3. **Open browser** and navigate to `http://localhost:5173`

### What You Should See:
- ✅ SF Dashboard header with dark/light mode toggle
- ✅ "Today's Events" ticker (will show "No events scheduled for today")
- ✅ Empty state message: "No Event Data Available"
- ✅ Message about adding website sources

## 🎯 Step 5: Verify Everything Works

### Test Dark/Light Mode:
1. **Click** the sun/moon icon in the top-right
2. **Verify** the theme switches properly
3. **Refresh** the page - theme should persist

### Test Refresh Button:
1. **Click** "Refresh Events" button
2. **Should show** loading spinner briefly
3. **Should return** to empty state (no data sources configured yet)

### Test Responsive Design:
1. **Resize** browser window
2. **Verify** layout adapts to different screen sizes
3. **Test** mobile view using browser dev tools

## 🏗️ Step 6: Understanding the Architecture

### Key Components:

#### `src/App.tsx` - Main Dashboard
- Orchestrates the entire application
- Manages state for events, venues, theme
- Handles data loading and organization
- Renders category stacks and venue nodes

#### `src/components/EventTicker.tsx` - Today's Events
- Horizontal scrolling ticker
- Shows only today's events
- Pauses on hover
- Responsive design

#### `src/components/VenueNode.tsx` - Individual Venues
- Collapsible venue containers
- **Collapsed**: Shows next 3 events
- **Expanded**: Shows Today/Tomorrow/Weekend
- Smart date filtering

#### `src/utils/EventStorage.ts` - Data Persistence
- IndexedDB integration
- Stores events locally
- Handles CRUD operations
- Data persistence between sessions

#### `src/utils/EventScraper.ts` - Web Scraping Engine
- Ready for real website integration
- Categorizes events by venue
- Handles data parsing and normalization
- Currently returns empty array (no sources configured)

### Data Flow:
```
Website Sources → EventScraper → EventStorage → App → Components
```

## 🔧 Step 7: Adding Real Data Sources

### Current State:
- Dashboard shows empty state
- No fallback/sample data
- Ready for real website integration

### To Add Data Sources:
1. **Open** `src/utils/EventScraper.ts`
2. **Add website sources** using:
   ```typescript
   EventScraper.addWebsiteSource('music', 'Venue Name', 'https://venue-website.com/events');
   ```
3. **Implement parsing logic** for each venue's website structure
4. **Test** with refresh button

### Event Categories Available:
- `museums` - Museums & Arts
- `music` - Music & Concerts  
- `cycling` - Cycling & Outdoors
- `comedy` - Comedy & Entertainment
- `food` - Food & Drink
- `tech` - Tech & Startups

## 🎨 Step 8: Customization Options

### Styling:
- **Colors**: Modify `tailwind.config.js`
- **Fonts**: Update `index.html` and `tailwind.config.js`
- **Layout**: Edit component files in `src/components/`

### Adding New Categories:
1. **Update** `getCategoryIcon()` in `App.tsx`
2. **Update** `getCategoryColor()` in `App.tsx`  
3. **Update** `getCategoryName()` in `App.tsx`
4. **Add** to EventScraper categories

### Event Data Structure:
```typescript
interface Event {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  cost?: string;
  url?: string;
  source: string;
  venue: string;
  scrapedAt: string;
  description?: string;
  category?: string;
}
```

## 🚀 Step 9: Available Scripts

```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🐛 Step 10: Troubleshooting

### Common Issues:

#### Port Already in Use:
```bash
npm run dev -- --port 3000
```

#### TypeScript Errors:
1. **Restart** TypeScript server in Cursor
2. **Check** all files copied correctly
3. **Verify** `tsconfig.json` is present

#### Styling Issues:
1. **Verify** `tailwind.config.js` is present
2. **Check** `postcss.config.js` configuration
3. **Ensure** `src/index.css` imports Tailwind

#### Dependencies Issues:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Getting Help:
- **Check** browser console for errors
- **Verify** all files are present
- **Test** in incognito mode
- **Check** Node.js version (16+ required)

## ✅ Step 11: Success Checklist

- [ ] Project opens in Cursor without errors
- [ ] `npm install` completes successfully
- [ ] `npm run dev` starts server on port 5173
- [ ] Dashboard loads in browser
- [ ] Dark/light mode toggle works
- [ ] Refresh button shows loading state
- [ ] Empty state displays correctly
- [ ] Layout is responsive
- [ ] No console errors

## 🎯 Next Steps

Once everything is working:

1. **Add real website sources** to populate with data
2. **Implement venue-specific parsing logic**
3. **Test with actual event data**
4. **Customize styling and layout**
5. **Deploy to hosting service**

## 📚 Additional Resources

- **React Documentation**: https://react.dev
- **TypeScript Handbook**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Vite Guide**: https://vitejs.dev/guide
- **Lucide Icons**: https://lucide.dev

---

**You're all set!** 🎉 SF Dashboard is now running in Cursor and ready for development.