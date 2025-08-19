# SF Dashboard - Real-Time Event Aggregator

A sophisticated, real-time event dashboard that scrapes live data from venue websites and organizes events by category and venue. Built with React, TypeScript, and Tailwind CSS.

## 🎯 Features

- 🎨 **Modern Interface**: Clean design with monospaced fonts and organized venue nodes
- 🌙 **Dark/Light Mode**: Toggle between themes with persistent preference
- 📱 **Fully Responsive**: Works perfectly on desktop, tablet, and mobile
- 💾 **Local Storage**: Events persist using IndexedDB
- 🏢 **Venue-Based Organization**: Events grouped by venue within categories
- 📊 **Smart Event Display**: Collapsed nodes show next 3 events, expanded shows Today/Tomorrow/Weekend
- 🎫 **Today's Events Ticker**: Horizontal scrolling ticker that pauses on hover
- 🔄 **Real Data Only**: No fallback content - only displays actual scraped event data
- 💰 **Complete Event Details**: When, where, what, and cost information
- ⚡ **Fast Performance**: Built with Vite for lightning-fast development and builds

## 🏗️ Architecture

### Event Organization
- **Categories**: Museums, Music, Cycling, Comedy, Food, Tech
- **Venue Nodes**: Each venue gets its own collapsible node
- **Smart Filtering**: Events automatically categorized by Today, Tomorrow, This Weekend
- **Real-Time Data**: Only displays live scraped data from actual venue websites

### Components Structure
```
App.tsx                 # Main dashboard orchestration
├── EventTicker.tsx     # Horizontal scrolling today's events
├── VenueNode.tsx       # Individual venue event containers
├── EventStorage.ts     # IndexedDB persistence layer
└── EventScraper.ts     # Website scraping engine
```

## 🚀 Quick Start

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn

### Installation
1. Clone or download this repository
2. Navigate to the project directory:
   ```bash
   cd "SF Dashboard"
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Development
Start the development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`

### Building for Production
```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
SF Dashboard/
├── src/
│   ├── types/
│   │   └── Event.ts              # TypeScript type definitions
│   ├── components/
│   │   ├── EventTicker.tsx       # Today's events ticker
│   │   └── VenueNode.tsx         # Venue event display
│   ├── utils/
│   │   ├── EventStorage.ts       # IndexedDB storage management
│   │   └── EventScraper.ts       # Event data scraping logic
│   ├── App.tsx                   # Main application component
│   ├── main.tsx                  # Application entry point
│   ├── index.css                 # Global styles and Tailwind imports
│   └── vite-env.d.ts            # Vite environment types
├── index.html                    # HTML template
├── package.json                  # Dependencies and scripts
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── README.md                    # This file
```

## 🎨 Event Categories & Venues

The dashboard organizes venues into six main categories:

- 🏛️ **Museums & Arts** - Art galleries, museums, cultural centers
- 🎵 **Music & Concerts** - Concert halls, music venues, festivals
- 🚴 **Cycling & Outdoors** - Bike shops, outdoor groups, cycling events
- 🎭 **Comedy & Entertainment** - Comedy clubs, theaters, entertainment venues
- 🍽️ **Food & Drink** - Restaurants, bars, food festivals, markets
- 💻 **Tech & Startups** - Tech meetups, conferences, networking events

## 🔧 Adding Website Sources

To add new venues for scraping:

```typescript
// In EventScraper.ts
EventScraper.addWebsiteSource('music', 'The Fillmore', 'https://thefillmore.com/events');
EventScraper.addWebsiteSource('museums', 'SFMOMA', 'https://sfmoma.org/exhibitions');
```

## 📊 Event Data Structure

Each event contains:
- **Title**: Event name
- **Date & Time**: When it's happening
- **Location**: Specific venue/address
- **Cost**: Ticket price or "Free"
- **Description**: Event details
- **URL**: Link to official event page
- **Venue**: Source venue name
- **Category**: Event type classification

## 🛠️ Customization

### Adding New Event Sources
1. Use `EventScraper.addWebsiteSource()` to register new venues
2. Implement venue-specific parsing logic in `EventScraper.ts`
3. Events will automatically appear in the appropriate category

### Venue Node Behavior
- **Collapsed**: Shows next 3 upcoming events
- **Expanded**: Shows events categorized by Today, Tomorrow, This Weekend
- **Empty venues**: Automatically hidden from display

### Styling
- **Colors & Themes**: Modify `tailwind.config.js`
- **Custom CSS**: Add styles to `src/index.css`
- **Fonts**: Update font imports in `index.html` and `tailwind.config.js`

### Data Storage
Events are stored locally using IndexedDB. Data persists between sessions and includes:
- Event details with timestamps
- Venue information and categorization
- Scraping metadata for cache management

## 🎫 Today's Events Ticker

The horizontal ticker at the top displays today's events:
- **Auto-scrolling**: Continuously scrolls through today's events
- **Hover to pause**: Stops scrolling when mouse hovers over it
- **Responsive**: Adapts to different screen sizes
- **Real-time**: Only shows events actually happening today

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 Technologies Used

- **React 18** - Modern UI framework with hooks
- **TypeScript** - Type safety and better developer experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful, customizable icons
- **IndexedDB** - Browser-native local database storage

## 🚫 No Fallback Data Policy

This dashboard follows a strict "real data only" policy:
- No sample or placeholder events
- Empty categories are clearly indicated
- Only displays data scraped from actual venue websites
- Encourages adding real data sources for meaningful content

## 📱 Browser Support

Works in all modern browsers that support:
- ES2020+ JavaScript features
- IndexedDB for local storage
- CSS Grid and Flexbox
- Web APIs (fetch, localStorage)

## 🚀 Deployment

This project can be deployed to any static hosting service:

- **Vercel**: Connect your GitHub repo for automatic deployments
- **Netlify**: Drag and drop the `dist` folder after running `npm run build`
- **GitHub Pages**: Use GitHub Actions for automated deployment
- **Firebase Hosting**: Deploy with Firebase CLI

## 📄 License

MIT License - Feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**SF Dashboard** - Built with ❤️ using modern web technologies