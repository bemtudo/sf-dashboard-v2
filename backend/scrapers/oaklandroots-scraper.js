import { BaseScraper } from './base-scraper.js';
import fetch from 'node-fetch';

export class OaklandRootsScraper extends BaseScraper {
    constructor() {
        super("oaklandroots", {
            url: "https://www.oaklandrootssc.com/wp-json/tribe/events/v1/events/",
            name: "Oakland Roots SC"
        });
        this.config.url = 'https://www.oaklandrootssc.com/wp-json/tribe/events/v1/events/'; // Force URL
    }

    async scrapeEvents() {
        console.log('⚽ Scraping Oakland Roots SC soccer events...');
        try {
            const response = await fetch(this.config.url);
            const data = await response.json();

            const events = [];
            const today = new Date();

            console.log(`📅 Looking for upcoming soccer games from today (${today.toDateString()})`);

            if (data && data.events && Array.isArray(data.events)) {
                console.log(`Found ${data.events.length} events from API`);
                for (const eventData of data.events) {
                    try {
                        const title = eventData.title;
                        const description = eventData.description || eventData.excerpt || '';
                        const dateStart = eventData.start_date_details ? new Date(
                            eventData.start_date_details.year,
                            eventData.start_date_details.month - 1, // Month is 0-indexed
                            eventData.start_date_details.day,
                            eventData.start_date_details.hour,
                            eventData.start_date_details.minutes
                        ) : null;
                        const dateEnd = eventData.end_date_details ? new Date(
                            eventData.end_date_details.year,
                            eventData.end_date_details.month - 1,
                            eventData.end_date_details.day,
                            eventData.end_date_details.hour,
                            eventData.end_date_details.minutes
                        ) : dateStart;
                        const location = eventData.venue ? eventData.venue.venue : "Oakland";
                        const eventUrl = eventData.url;
                        const timeText = eventData.start_date_details ? `${eventData.start_date_details.hour}:${String(eventData.start_date_details.minutes).padStart(2, '0')}` : '';
                        const cost = eventData.cost ? eventData.cost : 'Free';

                        if (!title || !dateStart || dateStart < today) {
                            continue; // Skip past or invalid events
                        }

                        events.push({
                            title: title,
                            date_start: dateStart,
                            date_end: dateEnd,
                            time_text: timeText,
                            description: description.replace(/<[^>]*>/g, ''), // Remove HTML tags
                            location: location,
                            event_url: eventUrl,
                            image_url: eventData.image ? eventData.image.url : null,
                            source: "oaklandroots",
                            venue: "Oakland Roots SC",
                            cost: cost
                        });
                        console.log(`🎯 Found Oakland Roots event: ${title} on ${dateStart.toDateString()}`);
                    } catch (error) {
                        console.log(`⚠️ Error processing event data: ${error.message}`, eventData);
                    }
                }
            }

            console.log(`✅ Oakland Roots SC scraper found ${events.length} upcoming games`);
            return events;

        } catch (error) {
            console.error(`❌ Error scraping Oakland Roots SC: ${error.message}`);
            return [];
        }
    }
}
