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
    
    // console.log('AuthContext: Initializing with token:', !!token, 'userData:', !!userData);
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('AuthContext: Found stored user data, validating token...');
        
        // Validate token by trying to refresh user data
        // If this fails, we'll clear the auth data and fall back to guest mode
        refreshUserData(token, parsedUser.id || parsedUser.id).then(() => {
          // Token is valid, set user as authenticated
          setUser(parsedUser);
          setGuestUser(null);
        }).catch((error) => {
          console.log('AuthContext: Token validation failed, clearing auth data:', error);
          // Token is invalid, clear auth data and fall back to guest mode
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          // Initialize guest user
          guestUserManager.getGuestUser().then(guest => {
            setGuestUser(guest);
          }).catch(guestError => {
            console.error('Error getting guest user:', guestError);
            setGuestUser(null);
          });
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        // Initialize guest user
        guestUserManager.getGuestUser().then(guest => {
          setGuestUser(guest);
        }).catch(guestError => {
          console.error('Error getting guest user:', guestError);
          setGuestUser(null);
        });
      }
    } else {
      // Initialize guest user if no authenticated user
      guestUserManager.getGuestUser().then(guest => {
        // console.log('AuthContext: Setting guest user:', guest);
        setGuestUser(guest);
      }).catch(error => {
        console.error('Error getting guest user:', error);
        setGuestUser(null);
      });
    }
    
    setLoading(false);
  }, []);

  // Function to refresh user data from server
  const refreshUserData = async (token, userId) => {
    try {
      console.log('AuthContext: Refreshing user data from server for userId:', userId);
      
      const response = await fetch(`/api/profile/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('AuthContext: Refreshed user data from server:', data);
        
        if (data.user) {
          // Update user data in localStorage and state
          localStorage.setItem('user', JSON.stringify(data.user));
          setUser(data.user);
          console.log('AuthContext: User data updated successfully');
        }
      } else {
        console.warn('AuthContext: Failed to refresh user data, token may be invalid');
        // Throw error to indicate token validation failed
        throw new Error(`Token validation failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('AuthContext: Error refreshing user data:', error);
      // Re-throw the error so the promise chain can catch it
      throw error;
    }
  };

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
          guestUserManager.getGuestUser().then(guest => {
            setGuestUser(guest);
          }).catch(error => {
            console.error('Error getting guest user:', error);
            setGuestUser(null);
          });
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
    guestUserManager.getGuestUser().then(guest => {
      setGuestUser(guest);
    }).catch(error => {
      console.error('Error getting guest user:', error);
      setGuestUser(null);
    });
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        await refreshUserData(token, parsedUser.id || parsedUser.id);
      } catch (error) {
        console.error('AuthContext: Error refreshing user:', error);
      }
    }
  };

  const value = {
    user,
    guestUser,
    login,
    logout,
    refreshUser,
    loading,
    isAuthenticated: !!user,
    isGuest: !!guestUser && !user,
    migrationStatus,
    guestUserManager
  };

  // console.log('AuthContext: Providing value:', { 
  //   user: !!user, 
  //   isAuthenticated: !!user, 
  //   isGuest: !!guestUser && !user,
  //   loading 
  // });

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
