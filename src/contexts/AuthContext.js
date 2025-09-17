'use client';

import { createContext, useContext, useState, useEffect } from 'react';
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

  const login = async (userData, token) => {
    console.log('AuthContext: Login called with userData:', userData);
    setUser(userData);
    
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
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
