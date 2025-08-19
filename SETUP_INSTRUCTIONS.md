# SF Dashboard - Setup Instructions for Cursor

Follow these steps to get SF Dashboard running in Cursor:

## Step 1: Create Project Folder
1. Create a new folder on your computer called `SF Dashboard`
2. Copy all the files from this Bolt project into that folder

## Step 2: Open in Cursor
1. Launch Cursor
2. Go to File → Open Folder
3. Select your `SF Dashboard` folder

## Step 3: Install Dependencies
Open the terminal in Cursor (Terminal → New Terminal) and run:
```bash
npm install
```

## Step 4: Start Development Server
```bash
npm run dev
```

## Step 5: Open in Browser
Navigate to `http://localhost:5173` to see your dashboard!

## File Structure You Should Have:

```
SF Dashboard/
├── src/
│   ├── components/
│   │   ├── EventTicker.tsx
│   │   └── VenueNode.tsx
│   ├── types/
│   │   └── Event.ts
│   ├── utils/
│   │   ├── EventStorage.ts
│   │   └── EventScraper.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── .gitignore
├── README.md
└── SETUP_INSTRUCTIONS.md (this file)
```

## Available Scripts

- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features Included

✅ **Venue-Based Organization**: Events grouped by venue within categories  
✅ **Smart Event Display**: Collapsed/expanded nodes with intelligent filtering  
✅ **Today's Events Ticker**: Horizontal scrolling ticker that pauses on hover  
✅ **Real Data Only**: No fallback content - only actual scraped data  
✅ **Complete Event Details**: When, where, what, cost information  
✅ **Dark/Light Mode**: Toggle in top-right corner  
✅ **Local Storage**: Events persist using IndexedDB  
✅ **Responsive Design**: Works on desktop, tablet, mobile  
✅ **Monospace Font**: JetBrains Mono for clean aesthetics  

## Available Scripts

- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features Included

✅ **Event Categories**: Museums, Music, Cycling, Comedy, Food, Tech  
✅ **Dark/Light Mode**: Toggle in top-right corner  
✅ **Local Storage**: Events persist using IndexedDB  
✅ **Responsive Design**: Works on desktop, tablet, mobile  
✅ **Sample Data**: 18 events across 6 categories  
✅ **Monospace Font**: JetBrains Mono for clean aesthetics  

## Troubleshooting

**If npm install fails:**
- Make sure you have Node.js 16+ installed
- Try deleting `node_modules` and `package-lock.json`, then run `npm install` again

**If the dev server won't start:**
- Check if port 5173 is already in use
- Try `npm run dev -- --port 3000` to use a different port

**If you see TypeScript errors:**
- Make sure all files are copied correctly
- Try restarting the TypeScript server in Cursor

## Adding Website Sources

To populate the dashboard with real event data:

1. **Open** `src/utils/EventScraper.ts`
2. **Add venue sources** using:
   ```typescript
   EventScraper.addWebsiteSource('category', 'Venue Name', 'https://venue-website.com/events');
   ```
3. **Implement parsing logic** for each venue's website structure
4. **Run refresh** to scrape and display real event data

## Next Steps

Once running, you can:
- Add real venue website sources for live data scraping
- Customize venue parsing logic for different website structures
- Modify styling and layout in the component files
- Add new event categories and venue types
- Deploy to any static hosting service

## Important Notes

- **No Sample Data**: Dashboard shows empty state until real sources are added
- **Real Data Only**: Follows strict policy of only displaying scraped content
- **Venue-Centric**: Events are organized by venue, not just category
- **Smart Filtering**: Automatically categorizes events by Today/Tomorrow/Weekend

Enjoy your Dashboard V3! 🚀

## Next Steps

Once running, you can:
- Add new event sources in `src/utils/EventScraper.ts`
- Modify styling in `src/App.tsx` and `tailwind.config.js`
- Add new event categories and icons
- Deploy to Vercel, Netlify, or any static hosting service

Enjoy your SF Dashboard! 🚀