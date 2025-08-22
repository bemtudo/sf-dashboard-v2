import { BaseScraper } from './base-scraper.js';
import fetch from 'node-fetch';

export class ValkyriesScraper extends BaseScraper {
    constructor() {
        super("valkyries", {
            url: "https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/teams/LV/schedule",
            name: "Las Vegas Valkyries"
        });
        this.config.url = 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/teams/LV/schedule'; // Force URL
    }

    async scrapeEvents() {
        console.log('🏀 Scraping Las Vegas Valkyries basketball games...');
        try {
            const response = await fetch(this.config.url);
            const data = await response.json();

            const events = [];
            const today = new Date();
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(today.getDate() + 7);

            console.log(`📅 Looking for Valkyries HOME games in next 7 days from today (${today.toDateString()})`);

            if (data.events && Array.isArray(data.events)) {
                console.log(`Found ${data.events.length} games from ESPN API`);

                data.events.forEach((game, index) => {
                    try {
                        // Parse game date
                        const gameDate = new Date(game.date);
                        if (gameDate < today || gameDate > sevenDaysFromNow) {
                            return; // Skip past games or games more than 7 days away
                        }

                        // Extract opponent
                        let opponent = "TBD";
                        let isHome = false;
                        let location = "Las Vegas";

                        if (game.competitions && game.competitions[0]) {
                            const competition = game.competitions[0];
                            const competitors = competition.competitors || [];
                            
                            // Find the opponent (not Valkyries)
                            const opponentTeam = competitors.find(team => 
                                team.team && team.team.abbreviation !== 'LV'
                            );
                            
                            if (opponentTeam) {
                                opponent = opponentTeam.team.displayName || opponentTeam.team.name;
                            }

                            // Determine if home or away
                            const valkyriesTeam = competitors.find(team => 
                                team.team && team.team.abbreviation === 'LV'
                            );
                            
                            if (valkyriesTeam) {
                                isHome = valkyriesTeam.homeAway === 'home';
                            }
                        }

                        // Only process home games
                        if (!isHome) {
                            return;
                        }

                        // Extract time
                        const timeText = new Date(game.date).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        });

                        const title = `Valkyries vs ${opponent}`;
                        
                        // Create description
                        let description = `vs ${opponent}`;
                        if (game.season && game.season.type === 1) {
                            description += " (Regular Season)";
                        } else if (game.season && game.season.type === 3) {
                            description += " (Playoffs)";
                        }

                        const event = {
                            title: title,
                            date_start: gameDate,
                            date_end: gameDate,
                            time_text: timeText,
                            description: description,
                            location: location,
                            event_url: game.links ? game.links[0]?.href : "https://valkyries.wnba.com",
                            image_url: null,
                            source: "valkyries",
                            venue: "Las Vegas Valkyries"
                        };

                        events.push(event);
                        console.log(`🎯 Found Valkyries game: ${gameType} ${opponent} on ${gameDate.toDateString()} at ${timeText}`);

                    } catch (error) {
                        console.log(`⚠️ Error processing Valkyries game ${index}: ${error.message}`);
                    }
                });
            }

            console.log(`✅ Valkyries scraper found ${events.length} upcoming games`);
            return events;

        } catch (error) {
            console.error(`❌ Error scraping Valkyries: ${error.message}`);
            return [];
        }
    }
}
