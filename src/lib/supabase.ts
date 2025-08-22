import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types matching your existing interfaces
export interface DatabaseEvent {
  id: string
  title: string
  date_start: string | null
  date_end: string | null
  time_text: string | null
  cost: string | null
  supporting_act: string | null
  genre: string | null
  description: string | null
  location: string | null
  source: string | null
  source_url: string | null
  image_url: string | null
  category: string | null
  price: string | null
  host: string | null
  venue: string | null
  event_url: string | null
  created_at: string
  updated_at: string
}

export interface DatabaseVenue {
  id: string
  name: string
  url: string | null
  category: string | null
  events_count: number
  analysis: any | null
  status: string
  created_at: string
  updated_at: string
}

// API functions that match your current backend
export const supabaseApi = {
  // Get all events (matches /api/events)
  async getEvents(): Promise<DatabaseEvent[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('date_start', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('date_start', { ascending: true })
    
    if (error) {
      console.error('Error fetching events:', error)
      return []
    }
    
    return data || []
  },

  // Get all venues (matches your venue logic)
  async getVenues(): Promise<DatabaseVenue[]> {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) {
      console.error('Error fetching venues:', error)
      return []
    }
    
    return data || []
  },

  // Add custom venue (matches your + button functionality)
  async addVenue(venue: Omit<DatabaseVenue, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseVenue | null> {
    const { data, error } = await supabase
      .from('venues')
      .insert([venue])
      .select()
      .single()
    
    if (error) {
      console.error('Error adding venue:', error)
      return null
    }
    
    return data
  },

  // Update venue analysis (for your venue analysis system)
  async updateVenueAnalysis(venueId: string, analysis: any, status: string): Promise<boolean> {
    const { error } = await supabase
      .from('venues')
      .update({ analysis, status })
      .eq('id', venueId)
    
    if (error) {
      console.error('Error updating venue analysis:', error)
      return false
    }
    
    return true
  },

  // Bulk insert events (for scraper results)
  async bulkInsertEvents(events: Omit<DatabaseEvent, 'id' | 'created_at' | 'updated_at'>[]): Promise<boolean> {
    if (events.length === 0) return true
    
    const { error } = await supabase
      .from('events')
      .insert(events)
    
    if (error) {
      console.error('Error bulk inserting events:', error)
      return false
    }
    
    return true
  },

  // Clean up old events (automated cleanup)
  async cleanupOldEvents(): Promise<boolean> {
    const { error } = await supabase.rpc('cleanup_old_events')
    
    if (error) {
      console.error('Error cleaning up old events:', error)
      return false
    }
    
    return true
  }
}
