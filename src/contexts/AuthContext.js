'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { syncService } from '../lib/syncService';
import { guestUserManager } from '../lib/guestUser';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestUser, setGuestUser] = useState(null);
  const [migrationStatus, setMigrationStatus] = useState(null);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    console.log('AuthContext: Initializing with token:', !!token, 'userData:', !!userData);
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('AuthContext: Setting user from localStorage:', parsedUser);
        setUser(parsedUser);
        setGuestUser(null);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      // Initialize guest user if no authenticated user
      const guest = guestUserManager.getGuestUser();
      console.log('AuthContext: Setting guest user:', guest);
      setGuestUser(guest);
    }
    
    setLoading(false);
  }, []);

  // Listen for cross-window authentication changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        console.log('AuthContext: Storage change detected:', e.key);
        
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          try {
            const parsedUser = JSON.parse(userData);
            console.log('AuthContext: Cross-window login detected:', parsedUser);
            setUser(parsedUser);
            setGuestUser(null);
          } catch (error) {
            console.error('Error parsing user data from storage event:', error);
          }
        } else {
          console.log('AuthContext: Cross-window logout detected');
          setUser(null);
          const guest = guestUserManager.getGuestUser();
          setGuestUser(guest);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (userData, token) => {
    console.log('AuthContext: Login called with userData:', userData);
    
    // Store auth data in localStorage immediately
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Update state
    setUser(userData);
    setGuestUser(null); // Clear guest user
    
    // Use sync service for optimal login sync
    try {
      await syncService.instance.handleLogin(userData, token);
      console.log('AuthContext: Login sync completed');
    } catch (error) {
      console.error('AuthContext: Login sync failed:', error);
    }
    
    // Force a re-render by updating the state
    setTimeout(() => {
      console.log('AuthContext: Login state updated, user should be set');
    }, 100);
    
    // Check if there's guest data to migrate
    if (guestUserManager.hasGuestData()) {
      try {
        setMigrationStatus('migrating');
        const migrationResult = await guestUserManager.migrateGuestDataToUser(userData, token);
        
        if (migrationResult.success) {
          setMigrationStatus('completed');
          setGuestUser(null); // Clear guest user after successful migration
          
          // Show success message
          console.log(`Migration completed: ${migrationResult.migratedSessions} sessions, ${migrationResult.migratedMessages} messages migrated`);
        } else {
          setMigrationStatus('failed');
          console.error('Migration failed:', migrationResult.message);
        }
      } catch (error) {
        setMigrationStatus('failed');
        console.error('Migration error:', error);
      }
    }
  };

  const logout = () => {
    setUser(null);
    setMigrationStatus(null);
    
    // Use sync service for logout cleanup
    syncService.instance.handleLogout();
    
    // Initialize guest user after logout
    const guest = guestUserManager.getGuestUser();
    setGuestUser(guest);
  };

  const value = {
    user,
    guestUser,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isGuest: !!guestUser && !user,
    migrationStatus,
    guestUserManager
  };

  console.log('AuthContext: Providing value:', { 
    user: !!user, 
    isAuthenticated: !!user, 
    isGuest: !!guestUser && !user,
    loading 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
