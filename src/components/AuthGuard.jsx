import React, { useState, useEffect } from 'react';
import { User } from '../api/entities';
import Login from '../pages/Login';

const AuthGuard = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if we have a token and can get current user
      const currentUser = await User.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      console.log('User is authenticated:', currentUser.full_name);
    } catch (error) {
      console.log('User not authenticated:', error.message);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (userData, token) => {
    console.log('Login successful, user data:', userData);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await User.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // User is authenticated, show the protected content
  return (
    <div>
      {/* User info bar */}
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f5f5f5', 
        borderBottom: '1px solid #ddd',
        marginBottom: '20px' 
      }}>
        <span>Welcome, {user.full_name} ({user.email}) - Role: {user.role}</span>
        <button 
          onClick={handleLogout} 
          style={{ marginLeft: '20px' }}
        >
          Logout
        </button>
      </div>
      
      {/* Protected content */}
      {children}
    </div>
  );
};

export default AuthGuard;