-- SF Dashboard V2 Database Schema
-- Matches existing Event and Venue interfaces exactly

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events table (matches your Event interface exactly)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  date_start TIMESTAMP WITH TIME ZONE,
  date_end TIMESTAMP WITH TIME ZONE,
  time_text TEXT,
  cost TEXT,
  supporting_act TEXT,
  genre TEXT,
  description TEXT,
  location TEXT,
  source TEXT,
  source_url TEXT,
  image_url TEXT,
  category TEXT,
  price TEXT,
  host TEXT,
  venue TEXT,
  event_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Venues table (matches your Venue interface exactly)
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  url TEXT,
  category TEXT,
  events_count INTEGER DEFAULT 0,
  analysis JSONB,
  status TEXT DEFAULT 'pending-analysis',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_date_start ON events(date_start);
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_venues_category ON venues(category);
CREATE INDEX IF NOT EXISTS idx_venues_name ON venues(name);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean old events (stay under free tier)
CREATE OR REPLACE FUNCTION cleanup_old_events()
RETURNS void AS $$
BEGIN
  -- Delete events older than 7 days
  DELETE FROM events 
  WHERE date_start < NOW() - INTERVAL '7 days';
  
  -- Update venue event counts
  UPDATE venues 
  SET events_count = (
    SELECT COUNT(*) FROM events 
    WHERE venue_id = venues.id
  );
  
  RAISE NOTICE 'Cleaned up old events and updated venue counts';
END;
$$ LANGUAGE plpgsql;

-- Function to get events (matches your current API)
CREATE OR REPLACE FUNCTION get_events()
RETURNS TABLE (
  id UUID,
  title TEXT,
  date_start TIMESTAMP WITH TIME ZONE,
  date_end TIMESTAMP WITH TIME ZONE,
  time_text TEXT,
  cost TEXT,
  supporting_act TEXT,
  genre TEXT,
  description TEXT,
  location TEXT,
  source TEXT,
  source_url TEXT,
  image_url TEXT,
  category TEXT,
  price TEXT,
  host TEXT,
  venue TEXT,
  event_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.date_start,
    e.date_end,
    e.time_text,
    e.cost,
    e.supporting_act,
    e.genre,
    e.description,
    e.location,
    e.source,
    e.source_url,
    e.image_url,
    e.category,
    e.price,
    e.host,
    e.venue,
    e.event_url
  FROM events e
  WHERE e.date_start >= NOW() - INTERVAL '30 days'
  ORDER BY e.date_start ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get venues (matches your current API)
CREATE OR REPLACE FUNCTION get_venues()
RETURNS TABLE (
  id UUID,
  name TEXT,
  url TEXT,
  category TEXT,
  events_count INTEGER,
  analysis JSONB,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.name,
    v.url,
    v.category,
    v.events_count,
    v.analysis,
    v.status
  FROM venues v
  ORDER BY v.name ASC;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing
INSERT INTO venues (name, url, category, status) VALUES
  ('Great American Music Hall', 'https://gamh.com', 'Music', 'scraper-ready'),
  ('The Roxie Theater', 'https://roxie.com', 'Film', 'scraper-ready'),
  ('San Francisco Giants', 'https://mlb.com/giants', 'Sports', 'scraper-ready'),
  ('Grizzly Peak Cyclists', 'https://grizz.org', 'Cycling', 'scraper-ready'),
  ('The Knockout', 'https://theknockoutsf.com', 'Music', 'scraper-ready'),
  ('Rickshaw Stop', 'https://rickshawstop.com', 'Music', 'scraper-ready'),
  ('Punch Line Comedy Club', 'https://punchlinecomedyclub.com', 'Comedy', 'scraper-ready'),
  ('Green Apple Books', 'https://greenapplebooks.com', 'Books & Literature', 'scraper-ready'),
  ('Booksmith', 'https://booksmith.com', 'Books & Literature', 'scraper-ready'),
  ('City Arts', 'https://www.cityarts.net/events/', 'Books & Literature', 'analysis-complete')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
