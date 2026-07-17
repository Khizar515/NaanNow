import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('naannow_token');
      if (token) {
        try {
          const userData = await api.getMe();
          setUser(userData);
        } catch (err) {
          console.error('Failed to load user:', err);
          localStorage.removeItem('naannow_token');
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('naannow_token', data.token);
    // After login, fetch the complete user object including status, rating, etc.
    const userData = await api.getMe();
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const data = await api.register(userData);
    localStorage.setItem('naannow_token', data.token);
    const updatedUser = await api.getMe();
    setUser(updatedUser);
    return updatedUser;
  };

  const logout = () => {
    localStorage.removeItem('naannow_token');
    setUser(null);
  };

  // We can add more auth-related global state or functions here
  
  const refreshUser = async () => {
    if (localStorage.getItem('naannow_token')) {
       try {
          const userData = await api.getMe();
          setUser(userData);
       } catch (err) {
          console.error(err);
       }
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
