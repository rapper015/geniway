// Advanced Sync Service for localStorage and Database synchronization
// Handles optimal data sync with conflict resolution and offline support

export class SyncService {
  constructor() {
    this.syncQueue = [];
    this.isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
    this.syncInProgress = false;
    this.retryAttempts = 3;
    this.syncInterval = null;
    
    // Listen for online/offline events (only in browser)
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processSyncQueue();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
    
    // Start periodic sync
    this.startPeriodicSync();
  }

  // Start periodic sync every 30 seconds when online
  startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncUserData();
      }
    }, 30000); // 30 seconds
  }

  // Stop periodic sync
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Add item to sync queue
  addToSyncQueue(operation, data, priority = 'normal') {
    const syncItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      data,
      priority,
      timestamp: Date.now(),
      attempts: 0
    };

    // Add to queue based on priority
    if (priority === 'high') {
      this.syncQueue.unshift(syncItem);
    } else {
      this.syncQueue.push(syncItem);
    }

    // Process queue if online
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  // Process sync queue
  async processSyncQueue() {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log('[SyncService] Processing sync queue:', this.syncQueue.length, 'items');

    while (this.syncQueue.length > 0) {
      const item = this.syncQueue.shift();
      
      try {
        await this.executeSyncItem(item);
        console.log('[SyncService] Successfully synced item:', item.id);
      } catch (error) {
        console.error('[SyncService] Failed to sync item:', item.id, error);
        
        // Retry if attempts < max retries
        if (item.attempts < this.retryAttempts) {
          item.attempts++;
          this.syncQueue.push(item);
        } else {
          console.error('[SyncService] Max retries reached for item:', item.id);
        }
      }
    }

    this.syncInProgress = false;
  }

  // Execute individual sync item
  async executeSyncItem(item) {
    const { operation, data } = item;

    switch (operation) {
      case 'updateProfile':
        return await this.syncProfileToDB(data);
      case 'saveMessage':
        return await this.syncMessageToDB(data);
      case 'updateStats':
        return await this.syncStatsToDB(data);
      case 'saveSession':
        return await this.syncSessionToDB(data);
      default:
        throw new Error(`Unknown sync operation: ${operation}`);
    }
  }

  // Sync user profile data
  async syncProfileToDB(profileData) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch('/api/profile/update', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      throw new Error(`Profile sync failed: ${response.status}`);
    }

    const result = await response.json();
    
    // Update localStorage with server response
    if (result.user) {
      localStorage.setItem('user', JSON.stringify(result.user));
    }

    return result;
  }

  // Sync message to database
  async syncMessageToDB(messageData) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch('/api/chat/save-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(messageData)
    });

    if (!response.ok) {
      throw new Error(`Message sync failed: ${response.status}`);
    }

    return await response.json();
  }

  // Sync user stats
  async syncStatsToDB(statsData) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch('/api/profile/stats', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(statsData)
    });

    if (!response.ok) {
      throw new Error(`Stats sync failed: ${response.status}`);
    }

    return await response.json();
  }

  // Sync session data
  async syncSessionToDB(sessionData) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(sessionData)
    });

    if (!response.ok) {
      throw new Error(`Session sync failed: ${response.status}`);
    }

    return await response.json();
  }

  // Comprehensive user data sync
  async syncUserData() {
    if (!this.isOnline) {
      console.log('[SyncService] Offline, skipping sync');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('[SyncService] No token, skipping sync');
      return;
    }

    try {
      console.log('[SyncService] Starting comprehensive user data sync');
      
      // 1. Sync profile data
      const profileData = this.getLocalProfileData();
      if (profileData && Object.keys(profileData).length > 0) {
        await this.syncProfileToDB(profileData);
        console.log('[SyncService] Profile data synced');
      }

      // 2. Sync chat history
      const chatHistory = this.getLocalChatHistory();
      if (chatHistory && chatHistory.length > 0) {
        await this.syncMessageToDB({ messages: chatHistory });
        console.log('[SyncService] Chat history synced');
      }

      // 3. Sync user stats
      const userStats = this.getLocalUserStats();
      if (userStats && Object.keys(userStats).length > 0) {
        await this.syncStatsToDB(userStats);
        console.log('[SyncService] User stats synced');
      }

      // 4. Fetch latest data from server
      await this.fetchLatestUserData();
      
      console.log('[SyncService] Comprehensive sync completed');
    } catch (error) {
      console.error('[SyncService] Sync failed:', error);
    }
  }

  // Get local profile data
  getLocalProfileData() {
    try {
      const userData = localStorage.getItem('user');
      const guestProfile = localStorage.getItem('guestProfile');
      
      if (userData) {
        return JSON.parse(userData);
      } else if (guestProfile) {
        return JSON.parse(guestProfile);
      }
      
      return null;
    } catch (error) {
      console.error('[SyncService] Error getting local profile data:', error);
      return null;
    }
  }

  // Get local chat history
  getLocalChatHistory() {
    try {
      const chatHistory = localStorage.getItem('chatHistory');
      return chatHistory ? JSON.parse(chatHistory) : [];
    } catch (error) {
      console.error('[SyncService] Error getting local chat history:', error);
      return [];
    }
  }

  // Get local user stats
  getLocalUserStats() {
    try {
      const userStats = localStorage.getItem('userStats');
      return userStats ? JSON.parse(userStats) : {};
    } catch (error) {
      console.error('[SyncService] Error getting local user stats:', error);
      return {};
    }
  }

  // Fetch latest user data from server
  async fetchLatestUserData() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Fetch latest user profile
      const userResponse = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        localStorage.setItem('user', JSON.stringify(userData.user));
        console.log('[SyncService] Latest user data fetched and stored');
      }

      // Fetch latest chat history
      const chatResponse = await fetch('/api/profile/chats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        localStorage.setItem('chatHistory', JSON.stringify(chatData.messages || []));
        console.log('[SyncService] Latest chat history fetched and stored');
      }

    } catch (error) {
      console.error('[SyncService] Error fetching latest data:', error);
    }
  }

  // Force immediate sync
  async forceSync() {
    console.log('[SyncService] Force sync requested');
    await this.syncUserData();
    await this.processSyncQueue();
  }

  // Handle login sync
  async handleLogin(userData, token) {
    console.log('[SyncService] Handling login sync');
    
    // Store auth data
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    
    // Sync any pending guest data
    const guestProfile = localStorage.getItem('guestProfile');
    if (guestProfile) {
      const profileData = JSON.parse(guestProfile);
      this.addToSyncQueue('updateProfile', profileData, 'high');
    }

    // Fetch latest data from server
    await this.fetchLatestUserData();
    
    // Process any pending sync items
    await this.processSyncQueue();
  }

  // Handle logout cleanup
  handleLogout() {
    console.log('[SyncService] Handling logout cleanup');
    
    // Clear sync queue
    this.syncQueue = [];
    
    // Stop periodic sync
    this.stopPeriodicSync();
    
    // Clear local storage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('chatHistory');
    localStorage.removeItem('userStats');
  }

  // Get sync status
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      queueLength: this.syncQueue.length,
      hasToken: !!localStorage.getItem('token')
    };
  }
}

// Create singleton instance (lazy initialization to avoid SSR issues)
let _syncService = null;

export const syncService = {
  get instance() {
    if (typeof window === 'undefined') {
      // Return a mock object during SSR
      return {
        addToSyncQueue: () => {},
        forceSync: () => Promise.resolve(),
        handleLogin: () => Promise.resolve(),
        handleLogout: () => {},
        getSyncStatus: () => ({ isOnline: true, syncInProgress: false, queueLength: 0, hasToken: false })
      };
    }
    
    if (!_syncService) {
      _syncService = new SyncService();
    }
    return _syncService;
  }
};
