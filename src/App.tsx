import React, { useState, useEffect } from 'react';
import { RefreshCw, Database, Bug, Sun, Moon, Plus } from 'lucide-react';
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isAddingVenue, setIsAddingVenue] = useState(false);
  const [newVenueUrl, setNewVenueUrl] = useState('');
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueCategory, setNewVenueCategory] = useState('Other');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    console.log(`🚀 useEffect triggered - loadEvents called`);
    // Load theme preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    // Load custom venues from localStorage
    const customVenues = JSON.parse(localStorage.getItem('customVenues') || '[]');
    console.log(`🔍 Loading custom venues from localStorage:`, customVenues);
    if (customVenues.length > 0) {
      console.log(`✅ Found ${customVenues.length} custom venues, adding to state`);
      setVenues(prevVenues => {
        const updated = [...prevVenues, ...customVenues];
        console.log(`🔄 Updated venues state with custom venues:`, updated);
        return updated;
      });
    } else {
      console.log(`📭 No custom venues found in localStorage`);
    }
    
    // Load existing events
    loadEvents();
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {
    // Apply theme to body
    document.body.className = theme;
    document.documentElement.className = theme;
  }, [theme]);

  // Debug modal state changes
  useEffect(() => {
    console.log('🔍 Modal state changed:', { isAddingVenue, newVenueName, newVenueUrl, newVenueCategory });
  }, [isAddingVenue, newVenueName, newVenueUrl, newVenueCategory]);

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
    
    // Get existing custom venues from localStorage to preserve them
    const customVenues = JSON.parse(localStorage.getItem('customVenues') || '[]');
    console.log(`🔍 Custom venues to preserve:`, customVenues);
    
    if (allEvents.length === 0) {
      console.log(`📭 No events to organize, but preserving ${customVenues.length} custom venues`);
      // Even with no events, preserve custom venues
      setVenues(customVenues);
      return;
    }
    
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
    
    // Merge with custom venues to preserve them
    const allVenues = [...venuesArray, ...customVenues];
    console.log(`🔗 Merged venues: ${venuesArray.length} from events + ${customVenues.length} custom = ${allVenues.length} total`);
    
    setVenues(allVenues);
    console.log(`🔧 setVenues called with:`, allVenues);
  };

  // Debug: Monitor venues state changes
  useEffect(() => {
    console.log(`🔄 Venues state changed:`, venues.length, 'venues:', venues);
    console.log(`🔄 hasEvents calculation:`, venues.some(venue => venue.events.length > 0));
    console.log(`🔄 initialLoadComplete:`, initialLoadComplete);
  }, [venues]);

  const groupVenuesByCategory = (venues: Venue[]) => {
    console.log('🏷️ groupVenuesByCategory called with venues:', venues);
    
    const categories = {
      'Music': venues.filter(v => v.category === 'Music'),
      'Film': venues.filter(v => v.category === 'Film'),
      'Cycling': venues.filter(v => v.category === 'Cycling'),
      'Meetups': venues.filter(v => v.category === 'Meetups'),
      'Comedy': venues.filter(v => v.category === 'Comedy'),
      'Sports': venues.filter(v => v.category === 'Sports'),
      'Books': venues.filter(v => v.category === 'Books'),
      'Food': venues.filter(v => v.category === 'Food'),
      'Tech': venues.filter(v => v.category === 'Tech'),
      'Other': venues.filter(v => !['Music', 'Film', 'Cycling', 'Meetups', 'Comedy', 'Sports', 'Books', 'Food', 'Tech'].includes(v.category))
    };

    console.log('🏷️ Categorized venues:', categories);
    
    // Log each venue and its category
    venues.forEach(venue => {
      console.log(`📍 Venue "${venue.name}" has category "${venue.category}"`);
    });

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

  const handleAddVenue = async () => {
    console.log('🚀 handleAddVenue called with:', { newVenueName, newVenueUrl, newVenueCategory });
    
    if (!newVenueName.trim() || !newVenueUrl.trim()) {
      console.log('❌ Validation failed - missing name or URL');
      alert('Venue name and URL are required.');
      return;
    }

    console.log('✅ Validation passed, creating venue object...');

    try {
      const newVenue: Venue = {
        id: newVenueName.toLowerCase().replace(/\s+/g, '-'), // Simple ID generation
        name: newVenueName,
        category: newVenueCategory,
        url: newVenueUrl,
        events: []
      };

      console.log('🎭 Created venue object:', newVenue);

      // TODO: Backend Integration
      // 1. Send venue URL to backend for analysis
      // 2. Backend determines best scraping approach
      // 3. Backend creates scraper template
      // 4. Frontend shows "Scraper in Development" status
      // 5. Admin can test and refine scraper
      
      // Analyze venue with backend
      console.log('🔍 Starting backend analysis...');
      try {
        const response = await fetch('http://localhost:3002/api/analyze-venue', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newVenueName,
            url: newVenueUrl
          })
        });
        
        console.log('📡 Backend response status:', response.status);
        
        if (response.ok) {
          const analysis = await response.json();
          console.log('🔍 Venue analysis:', analysis);
          
          // Add analysis results to venue
          newVenue.analysis = analysis;
          newVenue.status = 'analysis-complete';
        } else {
          console.log('⚠️ Backend response not ok:', response.status, response.statusText);
        }
      } catch (backendError) {
        console.log('⚠️ Backend analysis failed, continuing with local storage:', backendError);
        newVenue.status = 'pending-analysis';
      }
      
      console.log('💾 Storing venue in localStorage...');
      // Store in localStorage for now (we'll integrate with backend later)
      const existingVenues = JSON.parse(localStorage.getItem('customVenues') || '[]');
      const updatedVenues = [...existingVenues, newVenue];
      localStorage.setItem('customVenues', JSON.stringify(updatedVenues));
      
      console.log('📊 Updated venues in localStorage:', updatedVenues);
      
      console.log('🔄 Adding venue to current state...');
      // Add to current state
      setVenues(prevVenues => [...prevVenues, newVenue]);
      setIsAddingVenue(false);
      setNewVenueName('');
      setNewVenueUrl('');
      setNewVenueCategory('Other');
      console.log(`✅ Venue "${newVenue.name}" added successfully.`);
    } catch (error) {
      console.error('❌ Error adding venue:', error);
      alert('Failed to add venue. Please try again.');
    }
  };

  const categorizedVenues = groupVenuesByCategory(venues);
  const hasEvents = venues.some(venue => venue.events.length > 0);
  const hasVenues = venues.length > 0; // Check if we have any venues at all
  
  console.log('🎯 Dashboard state:', {
    totalVenues: venues.length,
    hasEvents,
    hasVenues,
    categorizedVenues: Object.fromEntries(
      Object.entries(categorizedVenues).map(([cat, ven]) => [cat, ven.length])
    )
  });


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
          
          <button 
            onClick={() => {
              const customVenues = JSON.parse(localStorage.getItem('customVenues') || '[]');
              const currentVenues = venues;
              console.log('🔍 DEBUG INFO:', {
                customVenuesInLocalStorage: customVenues,
                currentVenuesInState: currentVenues,
                localStorageKeys: Object.keys(localStorage)
              });
              alert(`Custom venues in localStorage: ${customVenues.length}\nCurrent venues in state: ${currentVenues.length}`);
            }} 
            className="control-button secondary"
          >
            Check Venues
          </button>
          
          <button onClick={toggleTheme} className="control-button secondary">
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
        </div>

        {lastRefresh && (
          <div className="status-bar">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last updated: {lastRefresh.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total events: {events.length} • Venues: {venues.length}
            </p>
          </div>
        )}
      </div>

      {/* Floating Add Venue Button */}
      <button
        onClick={() => {
          alert('+ button clicked!'); // Simple test
          console.log('🔘 + button clicked, opening modal...');
          setIsAddingVenue(true);
        }}
        className={`fixed top-24 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center floating-add-button ${
          theme === 'dark'
            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
            : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/25'
        }`}
        title="Add New Venue"
      >
        <Plus size={24} />
      </button>

      {/* Add Venue Modal */}
      {isAddingVenue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-lg shadow-xl ${
            theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
          }`}>
            <div className="p-6">
              <h2 className={`text-xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Add New Venue
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                    Venue Name
                  </label>
                  <input
                    type="text"
                    value={newVenueName}
                    onChange={(e) => setNewVenueName(e.target.value)}
                    placeholder="e.g., The Fillmore"
                    className={`w-full px-3 py-2 border rounded-md ${
                      theme === 'dark'
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={newVenueUrl}
                    onChange={(e) => setNewVenueUrl(e.target.value)}
                    placeholder="https://example.com/events"
                    className={`w-full px-3 py-2 border rounded-md ${
                      theme === 'dark'
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                    Category
                  </label>
                  <select
                    value={newVenueCategory}
                    onChange={(e) => setNewVenueCategory(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md ${
                      theme === 'dark'
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="Music">Music</option>
                    <option value="Film">Film</option>
                    <option value="Cycling">Cycling</option>
                    <option value="Meetups">Meetups</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Sports">Sports</option>
                    <option value="Books">Books</option>
                    <option value="Food">Food</option>
                    <option value="Tech">Tech</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsAddingVenue(false);
                    setNewVenueName('');
                    setNewVenueUrl('');
                    setNewVenueCategory('Other');
                  }}
                  className={`flex-1 px-4 py-2 rounded-md border ${
                    theme === 'dark'
                      ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddVenue}
                  disabled={!newVenueName.trim() || !newVenueUrl.trim()}
                  className={`flex-1 px-4 py-2 rounded-md text-white ${
                    !newVenueName.trim() || !newVenueUrl.trim()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : theme === 'dark'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  Add Venue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!initialLoadComplete ? (
        <div className="status-message">
          <div className="loading-spinner"></div>
          <h2 className="status-title">Loading Events...</h2>
          <p className="status-description">
            Fetching the latest events from our enhanced scraping service.
          </p>
        </div>
      ) : !hasVenues ? (
        <div className="status-message">
          <h2 className="status-title">No Venues Available</h2>
          <p className="status-description">
            Debug info: {venues.length} venues in state, hasVenues: {hasVenues.toString()}
            <br />
            Check console for detailed venue information.
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
              console.log(`🎭 Rendering category "${category}" with ${categoryVenues.length} venues:`, categoryVenues);
              
              if (categoryVenues.length === 0) {
                console.log(`❌ Skipping empty category "${category}"`);
                return null;
              }
              
              console.log(`✅ Rendering category "${category}" with venues:`, categoryVenues.map(v => v.name));
              
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