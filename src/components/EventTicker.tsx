import React, { useState, useEffect, useRef } from 'react';
import { Calendar, MapPin, DollarSign, Clock, ExternalLink } from 'lucide-react';
import { Event } from '../types/Event';

interface EventTickerProps {
  events: Event[];
  isDarkMode: boolean;
}

const EventTicker: React.FC<EventTickerProps> = ({ events, isDarkMode }) => {
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Filter events for today
  const today = new Date().toDateString();
  const todaysEvents = events.filter(event => 
    new Date(event.date).toDateString() === today
  );

  // Format time display - use time_text if available, otherwise fall back to time
  const formatTime = (event: Event) => {
    if (event.time_text && event.time_text.trim()) {
      return event.time_text;
    }
    if (event.time && event.time.trim()) {
      return event.time;
    }
    return 'Time TBD';
  };

  // Format date display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handle click on event card
  const handleEventClick = (event: Event) => {
    if (event.url && event.url !== '#') {
      window.open(event.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle mouse enter/leave with position preservation
  const handleMouseEnter = () => {
    if (scrollRef.current) {
      setScrollPosition(scrollRef.current.scrollLeft);
    }
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  if (todaysEvents.length === 0) {
    return (
      <div className={`border rounded-lg p-6 mb-8 font-mono ${
        isDarkMode 
          ? 'border-slate-700 bg-slate-800' 
          : 'border-gray-300 bg-white'
      }`}>
        <h2 className="text-xl font-bold mb-4">Today's Events</h2>
        <p className={`text-center ${
          isDarkMode ? 'text-slate-400' : 'text-gray-600'
        }`}>
          No events scheduled for today
        </p>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-6 mb-8 font-mono overflow-hidden ${
      isDarkMode 
        ? 'border-slate-700 bg-slate-800' 
        : 'border-gray-300 bg-white'
    }`}>
      <h2 className="text-xl font-bold mb-4">Today's Events</h2>
      <div 
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          ref={scrollRef}
          className={`flex gap-6 transition-transform duration-300 ${
            isPaused ? '' : 'animate-scroll'
          }`}
          style={{
            transform: isPaused ? `translateX(-${scrollPosition}px)` : 'none'
          }}
        >
          {todaysEvents.concat(todaysEvents).map((event, index) => (
            <div
              key={`${event.id}-${index}`}
              className={`flex-shrink-0 p-4 rounded border min-w-[350px] cursor-pointer transition-all duration-200 ticker-event-card ${
                isDarkMode 
                  ? 'border-slate-600 bg-slate-900 hover:border-slate-500 hover:bg-slate-800' 
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
              }`}
              onClick={() => handleEventClick(event)}
            >
              <h3 className="font-bold text-sm mb-2 truncate">{event.title}</h3>
              
              {/* Date and Time */}
              <div className={`flex items-center gap-2 mb-1 text-xs ${
                isDarkMode ? 'text-slate-400' : 'text-gray-600'
              }`}>
                <Calendar size={12} />
                <span>{formatDate(event.date)}</span>
              </div>
              
              <div className={`flex items-center gap-2 mb-1 text-xs ${
                isDarkMode ? 'text-slate-400' : 'text-gray-600'
              }`}>
                <Clock size={12} />
                <span>{formatTime(event)}</span>
              </div>
              
              {/* Location */}
              {event.location && (
                <div className={`flex items-center gap-2 mb-1 text-xs ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  <MapPin size={12} />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
              
              {/* Description */}
              {event.description && (
                <p className={`text-xs mb-2 line-clamp-2 ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-700'
                }`}>
                  {event.description}
                </p>
              )}
              
              {/* Cost */}
              {event.cost && (
                <div className={`flex items-center gap-2 text-xs ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  <DollarSign size={12} />
                  <span>{event.cost}</span>
                </div>
              )}
              
              {/* Click indicator */}
              <div className={`flex items-center gap-1 text-xs mt-2 ${
                isDarkMode 
                  ? 'text-blue-400' 
                  : 'text-blue-600'
              }`}>
                <ExternalLink size={10} />
                <span>Click to view details</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventTicker;