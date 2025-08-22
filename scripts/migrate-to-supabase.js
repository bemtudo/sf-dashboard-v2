#!/usr/bin/env node

/**
 * Migration Script: SF Dashboard V2 → Supabase
 * Copies current events from backend to Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function migrateEvents() {
  console.log('🚀 Starting migration to Supabase...')
  
  try {
    // Step 1: Fetch current events from backend
    console.log('📡 Fetching current events from backend...')
    const response = await fetch('http://localhost:3002/api/events')
    
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`)
    }
    
    const events = await response.json()
    
    console.log(`✅ Found ${events.length} events to migrate`)
    
    if (events.length === 0) {
      console.log('⚠️ No events to migrate')
      return
    }
    
    // Step 2: Transform events to match database schema
    console.log('🔄 Transforming events...')
    const transformedEvents = events.map(event => ({
      title: event.title || '',
      date_start: event.date_start || null,
      date_end: event.date_end || null,
      time_text: event.time_text || null,
      cost: event.cost || null,
      supporting_act: event.supporting_act || null,
      genre: event.genre || null,
      description: event.description || null,
      location: event.location || null,
      source: event.source || null,
      source_url: event.source_url || null,
      image_url: event.image_url || null,
      category: event.category || null,
      price: event.price || null,
      host: event.host || null,
      venue: event.venue || null,
      event_url: event.event_url || null
    }))
    
    // Step 3: Clear existing events (optional)
    console.log('🧹 Clearing existing events from database...')
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (deleteError) {
      console.warn('⚠️ Warning: Could not clear existing events:', deleteError.message)
    } else {
      console.log('✅ Cleared existing events')
    }
    
    // Step 4: Insert events in batches
    console.log('📥 Inserting events into Supabase...')
    const batchSize = 100
    let insertedCount = 0
    
    for (let i = 0; i < transformedEvents.length; i += batchSize) {
      const batch = transformedEvents.slice(i, i + batchSize)
      
      const { error: insertError } = await supabase
        .from('events')
        .insert(batch)
      
      if (insertError) {
        console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, insertError.message)
        continue
      }
      
      insertedCount += batch.length
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} events`)
    }
    
    console.log(`🎉 Migration complete! Inserted ${insertedCount} events`)
    
    // Step 5: Verify migration
    console.log('🔍 Verifying migration...')
    const { data: verifyData, error: verifyError } = await supabase
      .from('events')
      .select('id')
    
    if (verifyError) {
      console.error('❌ Error verifying migration:', verifyError.message)
    } else {
      console.log(`✅ Database now contains ${verifyData.length} events`)
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

async function migrateVenues() {
  console.log('\n🏢 Migrating venues...')
  
  try {
    // Get current venues from your existing system
    const existingVenues = [
      { name: 'Great American Music Hall', url: 'https://gamh.com', category: 'Music', status: 'scraper-ready' },
      { name: 'The Roxie Theater', url: 'https://roxie.com', category: 'Film', status: 'scraper-ready' },
      { name: 'San Francisco Giants', url: 'https://mlb.com/giants', category: 'Sports', status: 'scraper-ready' },
      { name: 'Grizzly Peak Cyclists', url: 'https://grizz.org', category: 'Cycling', status: 'scraper-ready' },
      { name: 'The Knockout', url: 'https://theknockoutsf.com', category: 'Music', status: 'scraper-ready' },
      { name: 'Rickshaw Stop', url: 'https://rickshawstop.com', category: 'Music', status: 'scraper-ready' },
      { name: 'Punch Line Comedy Club', url: 'https://punchlinecomedyclub.com', category: 'Comedy', status: 'scraper-ready' },
      { name: 'Green Apple Books', url: 'https://greenapplebooks.com', category: 'Books & Literature', status: 'scraper-ready' },
      { name: 'Booksmith', url: 'https://booksmith.com', category: 'Books & Literature', status: 'scraper-ready' }
    ]
    
    // Insert venues
    const { error } = await supabase
      .from('venues')
      .insert(existingVenues)
    
    if (error) {
      console.error('❌ Error inserting venues:', error.message)
    } else {
      console.log(`✅ Migrated ${existingVenues.length} venues`)
    }
    
  } catch (error) {
    console.error('❌ Venue migration failed:', error.message)
  }
}

async function main() {
  console.log('🏗️ SF Dashboard V2 → Supabase Migration')
  console.log('=====================================\n')
  
  // Check if backend is running
  try {
    const response = await fetch('http://localhost:3002/api/events')
    if (!response.ok) {
      throw new Error('Backend not responding')
    }
    const events = await response.json()
    if (!Array.isArray(events)) {
      throw new Error('Invalid response format')
    }
    console.log(`✅ Backend is running and has ${events.length} events`)
  } catch (error) {
    console.error('❌ Backend not responding on localhost:3002')
    console.error('Please start your backend first: node simple-backend-service.js')
    process.exit(1)
  }
  
  await migrateEvents()
  await migrateVenues()
  
  console.log('\n🎉 Migration complete!')
  console.log('\nNext steps:')
  console.log('1. Update your frontend to use Supabase instead of localhost:3002')
  console.log('2. Test that everything works')
  console.log('3. Deploy to Vercel')
}

// Run migration if this file is executed directly
main().catch(console.error);
