import { Event } from '../types/Event';

class EventStorage {
  private dbName = 'EventDashboard';
  private version = 1;
  private storeName = 'events';

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('url', 'url', { unique: true });
          store.createIndex('date', 'date');
          store.createIndex('source', 'source');
        }
      };
    });
  }

  async addEvent(eventData: Omit<Event, 'id' | 'scrapedAt'>): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(transaction.objectStoreNames[0]);
    
    const event: Event = {
      ...eventData,
      id: this.generateId(),
      scrapedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(event);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAllEvents(): Promise<Event[]> {
    const db = await this.getDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(transaction.objectStoreNames[0]);
    
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
    const store = transaction.objectStore(transaction.objectStoreNames[0]);
    
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