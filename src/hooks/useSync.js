import { useState, useEffect, useCallback } from 'react';
import { syncService } from '../lib/syncService';

export function useSync() {
  const [syncStatus, setSyncStatus] = useState({
    isOnline: true,
    syncInProgress: false,
    queueLength: 0,
    hasToken: false
  });

  // Update sync status periodically
  useEffect(() => {
    const updateStatus = () => {
      setSyncStatus(syncService.getSyncStatus());
    };

    // Update immediately
    updateStatus();

    // Update every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  // Force sync function
  const forceSync = useCallback(async () => {
    try {
      await syncService.forceSync();
      setSyncStatus(syncService.getSyncStatus());
    } catch (error) {
      console.error('Force sync failed:', error);
    }
  }, []);

  // Sync profile data
  const syncProfile = useCallback((profileData, priority = 'normal') => {
    syncService.addToSyncQueue('updateProfile', profileData, priority);
    setSyncStatus(syncService.getSyncStatus());
  }, []);

  // Sync message data
  const syncMessage = useCallback((messageData, priority = 'normal') => {
    syncService.addToSyncQueue('saveMessage', messageData, priority);
    setSyncStatus(syncService.getSyncStatus());
  }, []);

  // Sync stats data
  const syncStats = useCallback((statsData, priority = 'normal') => {
    syncService.addToSyncQueue('updateStats', statsData, priority);
    setSyncStatus(syncService.getSyncStatus());
  }, []);

  // Sync session data
  const syncSession = useCallback((sessionData, priority = 'normal') => {
    syncService.addToSyncQueue('saveSession', sessionData, priority);
    setSyncStatus(syncService.getSyncStatus());
  }, []);

  return {
    syncStatus,
    forceSync,
    syncProfile,
    syncMessage,
    syncStats,
    syncSession
  };
}
