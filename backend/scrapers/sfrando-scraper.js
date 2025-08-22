import puppeteer from 'puppeteer';

export class SFRandoScraper {
    constructor() {
        this.url = 'https://sfrandonneurs.org/';
        this.name = 'SF Randonneurs';
        this.category = 'Sports';
        this.browser = null;
    }

    async initBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
        return this.browser;
    }

    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    async scrape() {
        try {
            console.log('🚴‍♂️ Starting SF Randonneurs scraper...');
            
            const events = await this.scrapeEvents();
            
            console.log(`✅ Found ${events.length} cycling events`);
            
            return {
                success: true,
                events: events,
                count: events.length,
                duration: 0
            };
        } catch (error) {
            console.error('❌ Error scraping SF Randonneurs:', error);
            return {
                success: false,
                events: [],
                count: 0,
                duration: 0,
                error: error.message
            };
        } finally {
            await this.closeBrowser();
        }
    }

    async getPageContent(url) {
        try {
            const browser = await this.initBrowser();
            const page = await browser.newPage();
            
            // Set user agent to avoid being blocked
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // Set viewport
            await page.setViewport({ width: 1920, height: 1080 });
            
            console.log(`🌐 Loading page: ${url}`);
            
            // Navigate to page
            await page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            console.log(`⏳ Waiting for content to load...`);
            
            // Wait for content to load
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Get page content
            const content = await page.content();
            console.log(`📄 Page loaded, content length: ${content.length} characters`);
            
            await page.close();
            return content;
            
        } catch (error) {
            throw new Error(`Failed to fetch ${url}: ${error.message}`);
        }
    }

    async scrapeEvents() {
        try {
            const pageContent = await this.getPageContent(this.url);
            if (!pageContent) return [];
            
            const events = [];
            
            // Parse the events table
            const tableRowMatches = pageContent.match(/<tr[^>]*class="changerowcolor"[^>]*>([\s\S]*?)<\/tr>/gi);
            
            if (tableRowMatches) {
                tableRowMatches.forEach((row, index) => {
                    try {
                        // Extract table cells
                        const cellMatches = row.match(/<td[^>]*class="tablenoborderheader"[^>]*>([^<]+)<\/td>/gi);
                        
                        if (cellMatches && cellMatches.length >= 5) {
                            const eventName = this.cleanText(cellMatches[0].replace(/<[^>]*>/g, ''));
                            const dateText = this.cleanText(cellMatches[1].replace(/<[^>]*>/g, ''));
                            const startTime = this.cleanText(cellMatches[2].replace(/<[^>]*>/g, ''));
                            const timeLimit = this.cleanText(cellMatches[3].replace(/<[^>]*>/g, ''));
                            const eventType = this.cleanText(cellMatches[4].replace(/<[^>]*>/g, ''));
                            
                            // Skip header rows or empty rows
                            if (!eventName || eventName === 'Event' || !dateText) {
                                return;
                            }
                            
                            // Parse the date (format: MM/DD/YYYY)
                            const parsedDate = this.parseDate(dateText);
                            if (!parsedDate) {
                                console.log(`⚠️ Could not parse date: ${dateText}`);
                                return;
                            }
                            
                            // Combine date and time
                            const eventDateTime = this.combineDateAndTime(parsedDate, startTime);
                            
                            console.log(`🎯 Found SF Rando event: ${eventName} on ${eventDateTime} at ${startTime}`);
                            
                            const event = {
                                title: eventName,
                                description: `${eventType} ride with ${timeLimit} time limit`,
                                date_start: eventDateTime,
                                location: `${this.name}, San Francisco Bay Area`,
                                source: 'sfrando',
                                source_url: this.url,
                                category: 'Cycling',
                                price: 'Varies',
                                image_url: '',
                                time_text: startTime,
                                venue: this.name
                            };
                            
                            events.push(event);
                        }
                    } catch (error) {
                        console.warn(`⚠️ Error processing table row ${index}: ${error.message}`);
                    }
                });
            }
            
            // Also check for the "NEXT EVENT" banner
            const nextEventMatch = pageContent.match(/NEXT EVENT: ([^<]+)\.\s*<span[^>]*>([^<]+)<\/span>/);
            if (nextEventMatch) {
                const eventName = this.cleanText(nextEventMatch[1]);
                const dateText = this.cleanText(nextEventMatch[2]);
                
                const parsedDate = this.parseDate(dateText);
                if (parsedDate) {
                    console.log(`🎯 Found next event banner: ${eventName} on ${parsedDate}`);
                    
                    const event = {
                        title: eventName,
                        description: 'Upcoming SF Randonneurs cycling event',
                        date_start: parsedDate,
                        location: `${this.name}, San Francisco Bay Area`,
                        source: 'sfrando',
                        source_url: this.url,
                        category: 'Cycling',
                        price: 'Varies',
                        image_url: '',
                        time_text: 'TBD',
                        venue: this.name
                    };
                    
                    events.push(event);
                }
            }
            
            return events;
            
        } catch (error) {
            console.error('❌ Error scraping events:', error.message);
            return [];
        }
    }
    
    parseDate(dateText) {
        try {
            // Handle format: "MM/DD/YYYY" (e.g., "1/12/2025")
            const dateMatch = dateText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (dateMatch) {
                const month = parseInt(dateMatch[1]) - 1; // Month is 0-indexed
                const day = parseInt(dateMatch[2]);
                const year = parseInt(dateMatch[3]);
                return new Date(year, month, day);
            }
            
            // Handle format: "Saturday, Aug 30 2025"
            const longDateMatch = dateText.match(/(\w+),\s+(\w+)\s+(\d{1,2})\s+(\d{4})/);
            if (longDateMatch) {
                const dayName = longDateMatch[1];
                const monthName = longDateMatch[2];
                const day = parseInt(longDateMatch[3]);
                const year = parseInt(longDateMatch[4]);
                
                const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                                   'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                const monthIndex = monthNames.findIndex(name => 
                    monthName.toLowerCase().startsWith(name)
                );
                
                if (monthIndex !== -1) {
                    return new Date(year, monthIndex, day);
                }
            }
            
            return null;
        } catch (error) {
            console.log(`⚠️ Date parsing error: ${error.message}`);
            return null;
        }
    }
    
    combineDateAndTime(date, timeText) {
        try {
            if (!date || !timeText) return date;
            
            // Handle time formats like "8:00", "7:00"
            const timeMatch = timeText.match(/(\d{1,2}):(\d{2})/);
            if (timeMatch) {
                const hours = parseInt(timeMatch[1]);
                const minutes = parseInt(timeMatch[2]);
                
                const eventDate = new Date(date);
                eventDate.setHours(hours, minutes, 0, 0);
                
                return eventDate;
            }
            
            return date;
        } catch (error) {
            console.log(`⚠️ Time parsing error: ${error.message}`);
            return date;
        }
    }
    
    cleanText(text) {
        if (!text) return '';
        return text.replace(/\s+/g, ' ').trim();
    }
}
