import fetch from 'node-fetch';

export class GiantsScraper {
    constructor() {
        this.name = 'San Francisco Giants';
        this.url = 'https://statsapi.mlb.com/api/v1/schedule/games/?sportId=1&teamId=137&startDate=2025-08-01&endDate=2025-12-31';
        this.category = 'Sports';
    }

    async scrapeEvents() {
        console.log('⚾ Scraping San Francisco Giants games...');
        try {
            const response = await fetch(this.url);
            const data = await response.json();

            const events = [];
            const today = new Date();

            console.log(`📅 Looking for upcoming Giants games from today (${today.toDateString()})`);

            if (data && data.dates && Array.isArray(data.dates)) {
                for (const dateEntry of data.dates) {
                    if (dateEntry.games && Array.isArray(dateEntry.games)) {
                        for (const gameData of dateEntry.games) {
                            try {
                                const gameDateTime = new Date(gameData.gameDate); // ISO 8601 format

                                if (gameDateTime < today) {
                                    continue; // Skip past games
                                }

                                const homeTeam = gameData.teams.home.team.name;
                                const awayTeam = gameData.teams.away.team.name;
                                const isHomeGame = gameData.teams.home.team.id === 137; // Giants team ID is 137
                                
                                // Only process HOME games (skip away games)
                                if (!isHomeGame) {
                                    continue; // Skip away games
                                }
                                
                                const opponent = awayTeam; // Since this is a home game, opponent is always the away team
                                const location = gameData.venue ? gameData.venue.name : "Oracle Park";
                                const title = `Giants vs ${opponent}`;
                                const description = `Home game against ${opponent} at ${location}`;
                                const timeText = gameDateTime.toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit', 
                                    hour12: true,
                                    timeZone: 'America/Los_Angeles'
                                });

                                events.push({
                                    title: title,
                                    date_start: gameDateTime,
                                    date_end: gameDateTime,
                                    time_text: timeText,
                                    description: description,
                                    location: location,
                                    event_url: gameData.link ? `https://www.mlb.com${gameData.link}` : `https://www.mlb.com/giants/schedule`,
                                    image_url: null,
                                    source: "giants",
                                    venue: "San Francisco Giants"
                                });
                                console.log(`🎯 Found Giants game: ${title} on ${gameDateTime.toDateString()}`);
                            } catch (error) {
                                console.log(`⚠️ Error processing game data: ${error.message}`, gameData);
                            }
                        }
                    }
                }
            }

            console.log(`✅ San Francisco Giants scraper found ${events.length} upcoming games`);
            return events;

        } catch (error) {
            console.error(`❌ Error scraping San Francisco Giants: ${error.message}`);
            return [];
        }
    }
}
