import React, { useState } from 'react';
import { Calendar, MapPin, DollarSign, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { Event, Venue } from '../types/Event';

interface VenueNodeProps {
  venue: Venue;
  isDarkMode: boolean;
}

const VenueNode: React.FC<VenueNodeProps> = ({ venue, isDarkMode }) => {
  console.log(`🎭 VenueNode received:`, venue);
  console.log(`🎭 Venue events count:`, venue.events?.length);
  console.log(`🎭 Venue events:`, venue.events);

  const [isExpanded, setIsExpanded] = useState(false);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Calculate this weekend (Saturday and Sunday)
  const dayOfWeek = today.getDay();
  const daysUntilSaturday = (6 - dayOfWeek) % 7;
  const saturday = new Date(today);
  saturday.setDate(saturday.getDate() + daysUntilSaturday);
  const sunday = new Date(saturday);
  sunday.setDate(sunday.getDate() + 1);

  const categorizeEvents = (events: Event[]) => {
    const todayEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === today.toDateString();
    });

    const tomorrowEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === tomorrow.toDateString();
    });

    const weekendEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === saturday.toDateString() || 
             eventDate.toDateString() === sunday.toDateString();
    });

    const upcomingEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      // Temporarily allow all events to show for debugging
      return true;
      // TODO: Fix this when backend provides correct dates
      // return eventDate >= today;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { todayEvents, tomorrowEvents, weekendEvents, upcomingEvents };
  };

  const { todayEvents, tomorrowEvents, weekendEvents, upcomingEvents } = categorizeEvents(venue.events);

  console.log(`🎭 Event categorization results:`, {
    totalEvents: venue.events.length,
    todayEvents: todayEvents.length,
    tomorrowEvents: tomorrowEvents.length,
    weekendEvents: weekendEvents.length,
    upcomingEvents: upcomingEvents.length
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Los_Angeles'
    });
  };

  const isTimeAtMidnight = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    
    // Check if it's midnight in Pacific timezone
    // If stored as T00:00:00-07:00, it means no valid showtime was found
    if (dateString.includes('T00:00:00-07:00')) {
      return true;
    }
    
    return false;
  };

  const renderEvent = (event: Event) => (
    <div
      key={event.id}
      className={`p-3 rounded border mb-2 ${
        isDarkMode 
          ? 'border-slate-600 bg-slate-900' 
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      {event.image_url && (
        <div className="mb-3">
          <img 
            src={event.image_url} 
            alt={`Poster for ${event.title}`}
            className="w-full h-32 object-cover rounded border"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <h4 className="font-semibold text-sm mb-2">{event.title}</h4>
      
      <div className={`flex items-center gap-2 mb-1 text-xs ${
        isDarkMode ? 'text-slate-400' : 'text-gray-600'
      }`}>
        <Calendar size={12} />
        <span>
          {formatDate(event.date)}
          {!isTimeAtMidnight(event.date) && ` at ${formatTime(event.date)}`}
        </span>
      </div>
      
      {event.location && (
        <div className={`flex items-center gap-2 mb-1 text-xs ${
          isDarkMode ? 'text-slate-400' : 'text-gray-600'
        }`}>
          <MapPin size={12} />
          <span>{event.location}</span>
        </div>
      )}
      
      {event.screen && (
        <div className={`flex items-center gap-2 mb-1 text-xs ${
          isDarkMode ? 'text-slate-400' : 'text-gray-600'
        }`}>
          <span className="font-mono">🎬</span>
          <span>{event.screen}</span>
        </div>
      )}
      
      {event.cost && (
        <div className={`flex items-center gap-2 mb-2 text-xs ${
          isDarkMode ? 'text-slate-400' : 'text-gray-600'
        }`}>
          <DollarSign size={12} />
          <span>{event.cost}</span>
        </div>
      )}
      
      {event.description && (
        <p className={`text-xs mb-2 ${
          isDarkMode ? 'text-slate-300' : 'text-gray-700'
        }`}>
          {event.description}
        </p>
      )}
      
      {event.url && (
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 text-xs transition-colors ${
            isDarkMode
              ? 'text-blue-400 hover:text-blue-300'
              : 'text-blue-600 hover:text-blue-500'
          }`}
        >
          <ExternalLink size={12} />
          View Details
        </a>
      )}
    </div>
  );

  const renderEventSection = (title: string, events: Event[]) => {
    if (events.length === 0) return null;
    
    return (
      <div className="mb-4">
        <h4 className={`font-semibold text-sm mb-2 ${
          isDarkMode ? 'text-slate-300' : 'text-gray-700'
        }`}>
          {title} ({events.length})
        </h4>
        {events.map(renderEvent)}
      </div>
    );
  };

  if (venue.events.length === 0) {
    return null; // Don't render venues with no events
  }

  return (
    <div className={`border rounded-lg p-4 font-mono ${
      isDarkMode 
        ? 'border-slate-700 bg-slate-800' 
        : 'border-gray-300 bg-white'
    }`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-3 hover:opacity-75 transition-opacity"
      >
        <h3 className="font-bold text-lg">{venue.name}</h3>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${
            isDarkMode ? 'text-slate-400' : 'text-gray-600'
          }`}>
            {venue.events.length} events
          </span>
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </button>

      {!isExpanded ? (
        // Collapsed view: Show next 3 upcoming events
        <div>
          {upcomingEvents.slice(0, 3).map(renderEvent)}
          {upcomingEvents.length > 3 && (
            <p className={`text-xs text-center ${
              isDarkMode ? 'text-slate-400' : 'text-gray-600'
            }`}>
              +{upcomingEvents.length - 3} more events
            </p>
          )}
        </div>
      ) : (
        // Expanded view: Show categorized events
        <div>
          {renderEventSection('Today', todayEvents)}
          {renderEventSection('Tomorrow', tomorrowEvents)}
          {renderEventSection('This Weekend', weekendEvents)}
          
          {todayEvents.length === 0 && tomorrowEvents.length === 0 && weekendEvents.length === 0 && (
            <div>
              <h4 className={`font-semibold text-sm mb-2 ${
                isDarkMode ? 'text-slate-300' : 'text-gray-700'
              }`}>
                Upcoming Events
              </h4>
              {upcomingEvents.map(renderEvent)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VenueNode;