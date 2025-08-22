import { BaseScraper } from './base-scraper.js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export class SFCityFCScraper extends BaseScraper {
    constructor() {
        super("sfcityfc", {
            url: "https://www.sfcityfc.com/schedule",
            name: "SF City FC"
        });
        this.config.url = 'https://www.sfcityfc.com/schedule'; // Force URL
    }

    async scrapeEvents() {
        console.log('⚽ Scraping SF City FC soccer events...');
        try {
            const response = await fetch(this.config.url);
            const html = await response.text();
            const $ = cheerio.load(html);

            const events = [];
            const today = new Date();

            console.log(`📅 Looking for upcoming soccer games from today (${today.toDateString()})`);

            // Find all match cards in the current season
            const matchCards = $('.season-item');
            console.log(`Found ${matchCards.length} match cards`);
            
            // Debug: Show first few dates to understand the format
            console.log('🔍 First few match dates:');
            matchCards.slice(0, 5).each((index, card) => {
                const $card = $(card);
                const dateText = $card.find('.match-card_date').text().trim();
                const opponent = $card.find('.match-card_opponent a').text().trim();
                console.log(`  Card ${index}: ${dateText} vs ${opponent}`);
            });

            matchCards.each((index, card) => {
                try {
                    const $card = $(card);
                    
                    // Extract date
                    const dateText = $card.find('.match-card_date').text().trim();
                    if (!dateText) {
                        console.log(`⚠️ No date text found for card ${index}`);
                        return;
                    }

                    console.log(`🔍 Processing card ${index}: date="${dateText}"`);
                    
                    const parsedDate = this.parseDate(dateText);
                    if (!parsedDate) {
                        console.log(`⚠️ Could not parse date: ${dateText}`);
                        return;
                    }

                    // Check if this game is in the future
                    const gameDate = new Date(parsedDate);
                    console.log(`📅 Parsed date: ${gameDate.toDateString()}, Today: ${today.toDateString()}`);
                    
                    if (gameDate < today) {
                        console.log(`⏭️ Skipping past game: ${dateText} (${gameDate.toDateString()})`);
                        return; // Skip past games
                    }

                    // Extract opponent
                    const opponent = $card.find('.match-card_opponent a').text().trim();
                    if (!opponent) return;

                    // Extract home/away status
                    const isHome = $card.find('.match-card_opponent:contains("vs")').length > 0;
                    const isAway = $card.find('.match-card_opponent:contains("at")').length > 0;
                    
                    let gameType = "vs";
                    let location = "San Francisco";
                    
                    if (isAway) {
                        gameType = "at";
                        location = opponent;
                    }

                    // Extract score if available (for completed games)
                    const scoreText = $card.find('.match-card_score').text().trim();
                    let description = `${gameType} ${opponent}`;
                    
                    if (scoreText && scoreText !== 'TBD') {
                        description += ` (${scoreText})`;
                    }

                    // Create event datetime (assume 7:00 PM for games)
                    const eventDateTime = new Date(parsedDate);
                    eventDateTime.setHours(19, 0, 0, 0); // 7:00 PM

                    const event = {
                        title: `SF City FC ${gameType} ${opponent}`,
                        date_start: eventDateTime,
                        date_end: eventDateTime,
                        time_text: "7:00 PM",
                        description: description,
                        location: location,
                        event_url: "https://www.sfcityfc.com/schedule",
                        image_url: null,
                        source: "sfcityfc",
                        venue: "SF City FC"
                    };

                    events.push(event);
                    console.log(`🎯 Found SF City FC game: ${gameType} ${opponent} on ${gameDate.toDateString()}`);

                } catch (error) {
                    console.log(`⚠️ Error processing match card ${index}: ${error.message}`);
                }
            });

            console.log(`✅ SF City FC scraper found ${events.length} upcoming games`);
            
            // Debug: Show what we found
            if (events.length === 0) {
                console.log('🔍 No upcoming games found. All games might be in the past.');
                console.log('📅 Current date:', today.toDateString());
                console.log('📅 Sample dates from page:');
                matchCards.slice(0, 3).each((index, card) => {
                    const $card = $(card);
                    const dateText = $card.find('.match-card_date').text().trim();
                    const opponent = $card.find('.match-card_opponent a').text().trim();
                    const parsedDate = this.parseDate(dateText);
                    if (parsedDate) {
                        const gameDate = new Date(parsedDate);
                        console.log(`  ${dateText} vs ${opponent} -> ${gameDate.toDateString()} (${gameDate < today ? 'PAST' : 'FUTURE'})`);
                    }
                });
            }
            
            return events;

        } catch (error) {
            console.error(`❌ Error scraping SF City FC: ${error.message}`);
            return [];
        }
    }

    parseDate(dateText) {
        // Parse "May 4, 2025" format
        const dateMatch = dateText.match(/(\w+)\s+(\d{1,2}),\s+(\d{4})/);
        if (dateMatch) {
            const monthName = dateMatch[1];
            const day = parseInt(dateMatch[2]);
            const year = parseInt(dateMatch[3]);

            const monthNames = ['january', 'jan', 'february', 'feb', 'march', 'mar', 'april', 'apr', 'may', 'june', 'jun', 'july', 'jul', 'august', 'aug', 'september', 'sep', 'october', 'oct', 'november', 'nov', 'december', 'dec'];
            const monthIndex = monthNames.findIndex(name => monthName.toLowerCase().startsWith(name));
            
            if (monthIndex !== -1) {
                const actualMonthIndex = Math.floor(monthIndex / 2);
                return new Date(year, actualMonthIndex, day);
            }
        }
        return null;
    }
}
