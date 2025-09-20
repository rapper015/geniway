import Database from '@replit/database';

// Initialize Replit Database
// In Replit, the database URL is automatically provided
// For local development, we'll use a fallback or handle the error gracefully
let db;
try {
  // Try without parameters first (for Replit environment)
  db = new Database();
} catch (error) {
  console.warn('Replit Database not available, using mock database for local development');
  // Create a mock database for local development
  const mockData = new Map();
  db = {
    get: async (key) => {
      const data = mockData.get(key);
      return data ? JSON.parse(data) : null;
    },
    set: async (key, value) => {
      mockData.set(key, JSON.stringify(value));
    },
    delete: async (key) => {
      mockData.delete(key);
    },
    list: async (prefix) => {
      const keys = [];
      for (const key of mockData.keys()) {
        if (key.startsWith(prefix + ':')) {
          keys.push(key);
        }
      }
      return keys;
    }
  };
}

// Database utility functions
export class ReplitDB {
  constructor() {
    this.db = db;
  }

  // Generic CRUD operations
  async create(collection, id, data) {
    const key = `${collection}:${id}`;
    const document = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.db.set(key, document);
    return document;
  }

  async findById(collection, id) {
    const key = `${collection}:${id}`;
    return await this.db.get(key);
  }

  async findOne(collection, query) {
    const allItems = await this.list(collection);
    return allItems.find(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
  }

  async find(collection, query = {}) {
    const allItems = await this.list(collection);
    if (Object.keys(query).length === 0) {
      return allItems;
    }
    return allItems.filter(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
  }

  async update(collection, id, updateData) {
    const existing = await this.findById(collection, id);
    if (!existing) {
      throw new Error(`${collection} with id ${id} not found`);
    }
    
    const updated = {
      ...existing,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    const key = `${collection}:${id}`;
    await this.db.set(key, updated);
    return updated;
  }

  async delete(collection, id) {
    const key = `${collection}:${id}`;
    await this.db.delete(key);
    return true;
  }

  async list(collection) {
    const keys = await this.db.list(`${collection}:`);
    const items = [];
    
    for (const key of keys) {
      const item = await this.db.get(key);
      if (item) {
        items.push(item);
      }
    }
    
    return items;
  }

  async count(collection, query = {}) {
    const items = await this.find(collection, query);
    return items.length;
  }

  // Specialized methods for relationships
  async findUserSessions(userId) {
    return await this.find('session', { userId });
  }

  async findSessionMessages(sessionId) {
    return await this.find('message', { sessionId });
  }

  async findUserMessages(userId) {
    return await this.find('message', { userId });
  }

  // Generate unique IDs
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Batch operations
  async createMany(collection, items) {
    const results = [];
    for (const item of items) {
      const id = this.generateId();
      const result = await this.create(collection, id, item);
      results.push(result);
    }
    return results;
  }

  // Search functionality
  async search(collection, searchTerm, fields = []) {
    const allItems = await this.list(collection);
    return allItems.filter(item => {
      return fields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });
    });
  }
}

// Create singleton instance
const replitDB = new ReplitDB();

// Export both the class and instance
export { replitDB };
export default replitDB;
