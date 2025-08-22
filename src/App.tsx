import React, { useState, useEffect } from 'react';
import { RefreshCw, Database, Bug, Sun, Moon } from 'lucide-react';
import { Event, Venue } from './types/Event';
import EventStorage from './utils/EventStorage';
import EventScraper from './utils/EventScraper';
import EventTicker from './components/EventTicker';
import VenueNode from './components/VenueNode';
import './App.css';

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    console.log(`🚀 useEffect triggered - loadEvents called`);
    // Load theme preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    // Load existing events
    loadEvents();
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {
    // Apply theme to body
    document.body.className = theme;
    document.documentElement.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const loadEvents = async () => {
    console.log(`🔄 loadEvents called - starting...`);
    try {
      // Fetch fresh events from backend instead of using stored events
      const freshEvents = await EventScraper.scrapeAllSources();
      
      console.log(`🔍 Raw events from backend:`, freshEvents);
      console.log(`🔍 First event structure:`, freshEvents[0]);
      console.log(`🔍 Events have required fields:`, freshEvents.map(e => ({
        hasTitle: !!e.title,
        hasDate: !!e.date,
        hasVenue: !!e.venue,
        hasLocation: !!e.location,
        hasSource: !!e.source
      })));
      
      console.log(`🔍 Loaded ${freshEvents.length} events from backend:`, freshEvents.slice(0, 3).map(e => ({
        title: e.title,
        venue: e.venue,
        location: e.location,
        source: e.source,
        category: e.category
      })));
      
      setEvents(freshEvents);
      organizeEventsByVenue(freshEvents);
      setInitialLoadComplete(true);
      console.log(`✅ Loaded ${freshEvents.length} events from backend`);
    } catch (error) {
      console.error('Error loading events:', error);
      // Fallback to stored events if backend fails
      try {
        const storedEvents = await EventStorage.getAllEvents();
        setEvents(storedEvents);
        organizeEventsByVenue(storedEvents);
        setInitialLoadComplete(true);
        console.log(`⚠️ Fallback to ${storedEvents.length} stored events`);
      } catch (fallbackError) {
        console.error('Fallback to stored events also failed:', fallbackError);
        setInitialLoadComplete(true);
      }
    }
  };

  const organizeEventsByVenue = (allEvents: Event[]) => {
    console.log(`🏗️ Starting organizeEventsByVenue with ${allEvents.length} events`);
    console.log(`🔍 All events array:`, allEvents);
    console.log(`🔍 First 3 events:`, allEvents.slice(0, 3).map(e => ({
      title: e.title,
      venue: e.venue,
      location: e.location,
      source: e.source,
      category: e.category
    })));
    
    const venueMap = new Map<string, Venue>();
    
    allEvents.forEach((event, index) => {
      // Group by source (scraper) instead of venue name
      let venueName = event.source || 'Unknown Venue';
      
      // Map source to proper venue names
      if (event.source === 'sfrando') {
        venueName = 'SF Randonneurs';
      } else if (event.source === 'grizzlypeak') {
        venueName = 'Grizzly Peak Cyclists';
      } else if (event.source === 'roxie') {
        venueName = 'Roxie Theater';
      } else if (event.source === 'creativemornings') {
        venueName = 'Creative Mornings';
      } else if (event.source === 'punchline') {
        venueName = 'Punchline Comedy Club';
      } else if (event.source === 'ape') {
        venueName = 'Balboa Theater';
      } else if (event.source === 'balboa') {
        venueName = 'Balboa Theater';
      } else if (event.source === 'gamh') {
        venueName = 'Great American Music Hall';
      } else if (event.source === 'chapel') {
        venueName = 'The Chapel';
      } else if (event.source === 'cafedunord') {
        venueName = 'Cafe Du Nord';
      } else if (event.source === 'cobbs') {
        venueName = 'Cobbs Comedy Club';
      } else if (event.source === 'commonwealth') {
        venueName = 'Commonwealth Club';
      } else if (event.source === 'knockout') {
        venueName = 'Knockout';
      } else if (event.source === 'sfpl') {
        venueName = 'SF Public Library';
      } else if (event.source === 'strava') {
        venueName = 'Strava';
      } else if (event.source === 'booksmith') {
        venueName = 'Booksmith';
      } else if (event.source === 'sfcityfc') {
        venueName = 'SF City FC';
      } else if (event.source === 'oaklandroots') {
        venueName = 'Oakland Roots SC';
      } else if (event.source === 'warriors') {
        venueName = 'Golden State Warriors';
      } else if (event.source === 'valkyries') {
        venueName = 'Las Vegas Valkyries';
      } else if (event.source === 'giants') {
        venueName = 'San Francisco Giants';
      }
      
      // Determine category based on source
      let category = event.category || 'Other';
      if (['sfrando', 'grizzlypeak'].includes(event.source)) {
        category = 'Cycling';
      } else if (['roxie', 'gamh', 'balboa', 'ape'].includes(event.source)) {
        category = 'Film';
      } else if (['punchline', 'cobbs'].includes(event.source)) {
        category = 'Comedy';
              } else if (['knockout', 'rickshawstop', 'chapel', 'cafedunord'].includes(event.source)) {
          category = 'Music';
      } else if (['booksmith'].includes(event.source)) {
        category = 'Books';
      } else if (['creativemornings', 'commonwealth', 'sfpl'].includes(event.source)) {
        category = 'Meetups';
      } else if (['sfcityfc', 'oaklandroots', 'warriors', 'valkyries', 'giants'].includes(event.source)) {
        category = 'Sports';
      }
      
      const venueKey = venueName;
      
      console.log(`📍 Event ${index + 1}: "${event.title}" -> venue: "${venueName}" (from: source=${event.source}, category=${category})`);
      
      if (!venueMap.has(venueKey)) {
        venueMap.set(venueKey, {
          id: venueKey,
          name: venueName,
          category: category,
          url: event.url || '',
          events: []
        });
        console.log(`🏗️ Created new venue: "${venueName}" with category: "${category}"`);
      }
      console.log(`🔍 Adding event "${event.title}" to venue "${venueName}"`);
      venueMap.get(venueKey)!.events.push(event);
    });

    const venuesArray = Array.from(venueMap.values());
    console.log(`🔍 Final venues array:`, venuesArray);
    console.log(`🏗️ Final result: ${venuesArray.length} venues created:`, venuesArray.map(v => `${v.name} (${v.events.length} events, category: ${v.category})`));
    
    setVenues(venuesArray);
    console.log(`🔧 setVenues called with:`, venuesArray);
  };

  // Debug: Monitor venues state changes
  useEffect(() => {
    console.log(`🔄 Venues state changed:`, venues.length, 'venues:', venues);
    console.log(`🔄 hasEvents calculation:`, venues.some(venue => venue.events.length > 0));
    console.log(`🔄 initialLoadComplete:`, initialLoadComplete);
  }, [venues]);

  const groupVenuesByCategory = (venues: Venue[]) => {
    const categories = {
      'Film': venues.filter(v => v.category === 'Film'),
      'Comedy': venues.filter(v => v.category === 'Comedy'),
      'Music': venues.filter(v => v.category === 'Music'),
      'Books': venues.filter(v => v.category === 'Books'),
      'Food': venues.filter(v => v.category === 'Food'),
      'Tech': venues.filter(v => v.category === 'Tech'),
      'Cycling': venues.filter(v => v.category === 'Cycling'),
      'Sports': venues.filter(v => v.category === 'Sports'),
      'Other': venues.filter(v => !['Film', 'Comedy', 'Music', 'Books', 'Food', 'Tech', 'Cycling', 'Sports'].includes(v.category))
    };

    return categories;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Film': return '🎬';
      case 'Comedy': return '🎭';
      case 'Music': return '🎵';
      case 'Books': return '📚';
      case 'Food': return '🍽️';
      case 'Tech': return '💻';
      case 'Cycling': return '🚴‍♂️';
      case 'Sports': return '🏈';
      default: return '📅';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'Film': return 'Film & Cinema';
      case 'Comedy': return 'Comedy & Entertainment';
      case 'Music': return 'Music & Concerts';
      case 'Books': return 'Books & Literature';
      case 'Food': return 'Food & Dining';
      case 'Tech': return 'Tech & Innovation';
      case 'Cycling': return 'Cycling & Rides';
      case 'Sports': return 'Sports & Games';
      default: return 'Other Events';
    }
  };

  const refreshEvents = async () => {
    console.log(`🔄 refreshEvents called - starting...`);
    setLoading(true);
    try {
      // Scrape new events from backend
      const newEvents = await EventScraper.scrapeAllSources();
      
      console.log(`🔍 Received ${newEvents.length} events from backend:`, newEvents.slice(0, 3).map(e => ({
        title: e.title,
        venue: e.venue,
        location: e.location,
        source: e.source,
        category: e.category
      })));
      
      // Use the events directly from backend instead of saving to EventStorage
      setEvents(newEvents);
      organizeEventsByVenue(newEvents);
      setLastRefresh(new Date());
      
      console.log(`✅ Refreshed ${newEvents.length} events from backend`);
    } catch (error) {
      console.error('Error refreshing events:', error);
      if (error instanceof Error && error.name === 'ConstraintError') {
        console.log('🔄 ConstraintError detected, resetting database...');
        await EventScraper.resetDatabase();
        await EventStorage.clearAllEvents();
        // Retry after reset
        const scrapedEvents = await EventScraper.scrapeAllSources();
        setEvents(scrapedEvents);
        organizeEventsByVenue(scrapedEvents);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetDatabase = async () => {
    try {
      await EventStorage.clearAllEvents();
      setEvents([]);
      setVenues([]);
      console.log('✅ Database reset successfully');
    } catch (error) {
      console.error('Error resetting database:', error);
    }
  };

  const debugInfo = () => {
    console.log('🔍 Debug Info:');
    console.log('Events:', events);
    console.log('Venues:', venues);
    console.log('Theme:', theme);
    console.log('Last Refresh:', lastRefresh);
  };

  const categorizedVenues = groupVenuesByCategory(venues);
  const hasEvents = venues.some(venue => venue.events.length > 0);



  return (
    <div className={`App ${theme}`}>
      <div className="dashboard-header">
        <h1 className="dashboard-title">SF Dashboard</h1>
        
        <div className="controls">
          <button onClick={refreshEvents} disabled={loading} className="control-button">
            <RefreshCw size={16} />
            {loading ? 'Refreshing...' : 'Refresh Events'}
          </button>
          
          <button onClick={resetDatabase} className="control-button secondary">
            <Database size={16} />
            Reset DB
          </button>
          
          <button onClick={debugInfo} className="control-button secondary">
            <Bug size={16} />
            Debug
          </button>
          
          <button onClick={toggleTheme} className="control-button secondary">
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
        </div>

        {lastRefresh && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Last updated: {lastRefresh.toLocaleString()}
          </p>
        )}
      </div>

      {!initialLoadComplete ? (
        <div className="status-message">
          <h2 className="status-title">Loading Events...</h2>
          <p className="status-description">
            Fetching the latest events from our enhanced scraping service.
          </p>
        </div>
      ) : !hasEvents ? (
        <div className="status-message">
          <h2 className="status-title">No Event Data Available</h2>
          <p className="status-description">
            Click "Refresh Events" to fetch the latest events from our enhanced scraping service.
          </p>
        </div>
      ) : (
        <>


          <EventTicker events={events.filter(event => {
            const eventDate = new Date(event.date);
            const today = new Date();
            return eventDate.toDateString() === today.toDateString();
          })} isDarkMode={theme === 'dark'} />

          <div className="mt-8">
            {Object.entries(categorizedVenues).map(([category, categoryVenues]) => {
              if (categoryVenues.length === 0) {
                return null;
              }
              
              return (
                <div key={category} className="mb-12">
                  <h2 className="text-2xl font-bold mb-6 text-center uppercase tracking-wider font-mono">
                    {getCategoryIcon(category)} {getCategoryName(category)}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryVenues.map(venue => (
                      <VenueNode 
                        key={venue.id}
                        venue={venue} 
                        isDarkMode={theme === 'dark'} 
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default App;