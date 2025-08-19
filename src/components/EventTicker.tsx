import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, DollarSign } from 'lucide-react';
import { Event } from '../types/Event';

interface EventTickerProps {
  events: Event[];
  isDarkMode: boolean;
}

const EventTicker: React.FC<EventTickerProps> = ({ events, isDarkMode }) => {
  const [isPaused, setIsPaused] = useState(false);
  
  // Filter events for today
  const today = new Date().toDateString();
  const todaysEvents = events.filter(event => 
    new Date(event.date).toDateString() === today
  );

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
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className={`flex gap-6 ${isPaused ? '' : 'animate-scroll'}`}>
          {todaysEvents.concat(todaysEvents).map((event, index) => (
            <div
              key={`${event.id}-${index}`}
              className={`flex-shrink-0 p-4 rounded border min-w-[300px] ${
                isDarkMode 
                  ? 'border-slate-600 bg-slate-900' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <h3 className="font-bold text-sm mb-2 truncate">{event.title}</h3>
              <div className={`flex items-center gap-2 mb-1 text-xs ${
                isDarkMode ? 'text-slate-400' : 'text-gray-600'
              }`}>
                <Calendar size={12} />
                <span>{event.time || 'Time TBD'}</span>
              </div>
              {event.location && (
                <div className={`flex items-center gap-2 mb-1 text-xs ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  <MapPin size={12} />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
              {event.cost && (
                <div className={`flex items-center gap-2 text-xs ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  <DollarSign size={12} />
                  <span>{event.cost}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventTicker;