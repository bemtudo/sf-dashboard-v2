import React, { useState, useEffect } from 'react';
import { RefreshCw, Sun, Moon } from 'lucide-react';
import EventStorage from './utils/EventStorage';
import EventScraper from './utils/EventScraper';
import EventTicker from './components/EventTicker';
import VenueNode from './components/VenueNode';
import { Event, Venue } from './types/Event';

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    loadEvents();
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  const loadEvents = async () => {
    try {
      const storedEvents = await EventStorage.getAllEvents();
      setEvents(storedEvents);
      organizeEventsByVenue(storedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const organizeEventsByVenue = (events: Event[]) => {
    const venueMap = new Map<string, Venue>();

    events.forEach(event => {
      const venueKey = `${event.venue}-${event.category}`;
      
      if (!venueMap.has(venueKey)) {
        venueMap.set(venueKey, {
          id: venueKey,
          name: event.venue,
          category: event.category || 'other',
          url: event.url || '',
          events: []
        });
      }

      venueMap.get(venueKey)!.events.push(event);
    });

    // Sort events within each venue by date
    venueMap.forEach(venue => {
      venue.events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    setVenues(Array.from(venueMap.values()));
  };

  const refreshEvents = async () => {
    setIsLoading(true);
    try {
      // Clear existing events first since we only want real data
      await EventStorage.clearAllEvents();
      
      // Scrape new events (currently returns empty array until real sources are added)
      const newEvents = await EventScraper.scrapeAllSources();
      
      // Store events in IndexedDB
      for (const event of newEvents) {
        await EventStorage.addEvent(event);
      }
      
      // Reload events from storage
      await loadEvents();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error refreshing events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const groupVenuesByCategory = (venues: Venue[]) => {
    return venues.reduce((groups, venue) => {
      const category = venue.category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(venue);
      return groups;
    }, {} as Record<string, Venue[]>);
  };

  const groupedVenues = groupVenuesByCategory(venues);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'museums': return '🏛️';
      case 'music': return '🎵';
      case 'cycling': return '🚴';
      case 'comedy': return '🎭';
      case 'food': return '🍽️';
      case 'tech': return '💻';
      default: return '📅';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'museums': return 'bg-purple-500';
      case 'music': return 'bg-pink-500';
      case 'cycling': return 'bg-green-500';
      case 'comedy': return 'bg-yellow-500';
      case 'food': return 'bg-orange-500';
      case 'tech': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'museums': return 'Museums & Arts';
      case 'music': return 'Music & Concerts';
      case 'cycling': return 'Cycling & Outdoors';
      case 'comedy': return 'Comedy & Entertainment';
      case 'food': return 'Food & Drink';
      case 'tech': return 'Tech & Startups';
      default: return 'Other Events';
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-slate-900 text-slate-100' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className={`border rounded-lg p-6 mb-8 font-mono ${
          isDarkMode 
            ? 'border-slate-700 bg-slate-800' 
            : 'border-gray-300 bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard V3</h1>
              <p className={`text-sm ${
                isDarkMode ? 'text-slate-400' : 'text-gray-600'
              }`}>
                {lastRefresh 
                  ? `Last updated: ${lastRefresh.toLocaleString()}`
                  : 'No recent updates'
                }
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-md transition-colors ${
                  isDarkMode
                    ? 'hover:bg-slate-700 text-slate-300'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              <button
                onClick={refreshEvents}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-mono text-sm transition-colors ${
                  isDarkMode
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-100'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                {isLoading ? 'Refreshing...' : 'Refresh Events'}
              </button>
            </div>
          </div>
        </div>

        {/* Today's Events Ticker */}
        <EventTicker events={events} isDarkMode={isDarkMode} />

        {/* Venue Stacks by Category */}
        {Object.entries(groupedVenues).map(([category, categoryVenues]) => (
          <div key={category} className={`border rounded-lg p-6 mb-8 font-mono ${
            isDarkMode 
              ? 'border-slate-700 bg-slate-800' 
              : 'border-gray-300 bg-white'
          }`}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">{getCategoryIcon(category)}</span>
              <div className={`w-3 h-3 rounded-full ${getCategoryColor(category)}`}></div>
              {getCategoryName(category)} ({categoryVenues.length} venues)
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {categoryVenues.map((venue) => (
                <VenueNode 
                  key={venue.id} 
                  venue={venue} 
                  isDarkMode={isDarkMode} 
                />
              ))}
            </div>
          </div>
        ))}

        {venues.length === 0 && !isLoading && (
          <div className={`border rounded-lg p-12 text-center font-mono ${
            isDarkMode 
              ? 'border-slate-700 bg-slate-800' 
              : 'border-gray-300 bg-white'
          }`}>
            <h3 className="text-xl font-bold mb-2">No Event Data Available</h3>
            <p className={`mb-4 ${
              isDarkMode ? 'text-slate-400' : 'text-gray-600'
            }`}>
              Add website sources to the scraper to populate with real event data.
            </p>
            <h1 className="text-3xl font-bold mb-2">SF Dashboard</h1>
            <p className={`text-sm ${
              isDarkMode ? 'text-slate-500' : 'text-gray-500'
            }`}>
              This dashboard only displays real scraped data - no fallback content.
            </p>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default App;