import { Event } from '../types/Event';

class EventStorage {
  private dbName = 'EventDashboard';
  private version = 4; // Increment to force complete database reset
  private storeName = 'events';

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => {
        console.error('❌ Database open error:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        const db = request.result;
        console.log(`✅ Database opened successfully. Current version: ${db.version}`);
        resolve(db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;
        
        console.log(`🔄 Database upgrade needed!`);
        console.log(`   Old version: ${oldVersion}`);
        console.log(`   New version: ${this.version}`);
        console.log(`   Database name: ${this.dbName}`);
        
        // Force complete database reset for version 4
        if (oldVersion < 4) {
          console.log('🧹 Performing complete database reset...');
          
          // Delete all existing object stores
          const storeNames = Array.from(db.objectStoreNames);
          console.log(`   Existing stores: ${storeNames.join(', ')}`);
          
          storeNames.forEach(storeName => {
            if (db.objectStoreNames.contains(storeName)) {
              db.deleteObjectStore(storeName);
              console.log(`🗑️ Deleted store: ${storeName}`);
            }
          });
          
          // Create fresh object store with correct configuration
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('url', 'url', { unique: false }); // Explicitly set unique: false
          store.createIndex('date', 'date');
          store.createIndex('source', 'source');
          
          console.log('✅ Fresh database created with non-unique URL index');
          console.log(`   New store: ${this.storeName}`);
          console.log(`   URL index unique: false`);
        }
      };
    });
  }

  // Force clear the database completely
  async forceResetDatabase(): Promise<void> {
    try {
      console.log('🧹 Force resetting database...');
      
      // Close any existing connections
      const db = await this.getDB();
      db.close();
      
      // Delete the database completely
      const deleteRequest = indexedDB.deleteDatabase(this.dbName);
      
      return new Promise((resolve, reject) => {
        deleteRequest.onerror = () => reject(deleteRequest.error);
        deleteRequest.onsuccess = () => {
          console.log('✅ Database deleted successfully');
          resolve();
        };
      });
    } catch (error) {
      console.error('❌ Error force resetting database:', error);
      throw error;
    }
  }

  async addEvent(eventData: Omit<Event, 'id' | 'scrapedAt'>): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const event: Event = {
        ...eventData,
        id: this.generateId(),
        scrapedAt: new Date().toISOString()
      };

      return new Promise((resolve, reject) => {
        const request = store.put(event);
        request.onerror = (error) => {
          console.warn(`⚠️ Failed to add event "${event.title}":`, error);
          // If it's a constraint error, try to update existing event instead
          if (error instanceof Error && error.name === 'ConstraintError') {
            console.log(`🔄 Attempting to update existing event with URL: ${event.url}`);
            // Try to find and update existing event
            this.updateExistingEvent(event).then(resolve).catch(reject);
          } else {
            reject(error);
          }
        };
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error('❌ Error in addEvent:', error);
      throw error;
    }
  }

  private async updateExistingEvent(event: Event): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      // Try to find existing event by URL
      const urlIndex = store.index('url');
      const existingEvent = await new Promise<Event | undefined>((resolve, reject) => {
        const request = urlIndex.get(event.url);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
      
      if (existingEvent) {
        // Update existing event with new data
        const updatedEvent = { ...existingEvent, ...event, id: existingEvent.id };
        await new Promise<void>((resolve, reject) => {
          const request = store.put(updatedEvent);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
        });
        console.log(`✅ Updated existing event: ${event.title}`);
      } else {
        // If no existing event found, try adding with a modified URL to avoid conflicts
        const modifiedEvent = { ...event, url: `${event.url}_${Date.now()}` };
        await this.addEvent(modifiedEvent);
      }
    } catch (error) {
      console.error('❌ Error updating existing event:', error);
      throw error;
    }
  }

  async getAllEvents(): Promise<Event[]> {
    const db = await this.getDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const events = request.result || [];
        // Sort by date
        events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        resolve(events);
      };
    });
  }

  async clearAllEvents(): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private generateId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new EventStorage();