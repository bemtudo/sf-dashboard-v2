import React, { useState } from 'react';
import { Calendar, MapPin, DollarSign, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { Event, Venue } from '../types/Event';

interface VenueNodeProps {
  venue: Venue;
  isDarkMode: boolean;
}

const VenueNode: React.FC<VenueNodeProps> = ({ venue, isDarkMode }) => {
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
      return eventDate >= today;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { todayEvents, tomorrowEvents, weekendEvents, upcomingEvents };
  };

  const { todayEvents, tomorrowEvents, weekendEvents, upcomingEvents } = categorizeEvents(venue.events);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
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
      <h4 className="font-semibold text-sm mb-2">{event.title}</h4>
      
      <div className={`flex items-center gap-2 mb-1 text-xs ${
        isDarkMode ? 'text-slate-400' : 'text-gray-600'
      }`}>
        <Calendar size={12} />
        <span>{formatDate(event.date)} {event.time && `at ${event.time}`}</span>
      </div>
      
      {event.location && (
        <div className={`flex items-center gap-2 mb-1 text-xs ${
          isDarkMode ? 'text-slate-400' : 'text-gray-600'
        }`}>
          <MapPin size={12} />
          <span>{event.location}</span>
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