import { BaseScraper } from './base-scraper.js';
import fetch from 'node-fetch';

export class WarriorsScraper extends BaseScraper {
    constructor() {
        super("warriors", {
            url: "https://stats.nba.com/stats/teamgamelog?TeamID=1610612744&Season=2024-25&SeasonType=Regular%20Season",
            name: "Golden State Warriors"
        });
        this.config.url = 'https://stats.nba.com/stats/teamgamelog?TeamID=1610612744&Season=2024-25&SeasonType=Regular%20Season'; // Force URL
    }

    async scrapeEvents() {
        console.log('🏀 Scraping Golden State Warriors basketball games...');
        try {
            // Use a simple approach - fetch from ESPN or similar
            const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/GSW/schedule');
            const data = await response.json();

            const events = [];
            const today = new Date();
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(today.getDate() + 7);

            console.log(`📅 Looking for Warriors HOME games in next 7 days from today (${today.toDateString()})`);

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
                        let location = "Chase Center, San Francisco";

                        if (game.competitions && game.competitions[0]) {
                            const competition = game.competitions[0];
                            const competitors = competition.competitors || [];
                            
                            // Find the opponent (not Warriors)
                            const opponentTeam = competitors.find(team => 
                                team.team && team.team.abbreviation !== 'GSW'
                            );
                            
                            if (opponentTeam) {
                                opponent = opponentTeam.team.displayName || opponentTeam.team.name;
                            }

                            // Determine if home or away
                            const warriorsTeam = competitors.find(team => 
                                team.team && team.team.abbreviation === 'GSW'
                            );
                            
                            if (warriorsTeam) {
                                isHome = warriorsTeam.homeAway === 'home';
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

                        const title = `Warriors vs ${opponent}`;
                        
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
                            event_url: game.links ? game.links[0]?.href : "https://www.nba.com/warriors",
                            image_url: null,
                            source: "warriors",
                            venue: "Golden State Warriors"
                        };

                        events.push(event);
                        console.log(`🎯 Found Warriors game: ${gameType} ${opponent} on ${gameDate.toDateString()} at ${timeText}`);

                    } catch (error) {
                        console.log(`⚠️ Error processing Warriors game ${index}: ${error.message}`);
                    }
                });
            }

            console.log(`✅ Warriors scraper found ${events.length} upcoming games`);
            return events;

        } catch (error) {
            console.error(`❌ Error scraping Warriors: ${error.message}`);
            return [];
        }
    }
}
