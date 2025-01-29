import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isAuthenticated") === "true";
  });

  // Check authentication status when the app loads
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(
          'https://frontend-take-home-service.fetch.com/dogs/breeds',
          { credentials: 'include' }
        );

        if (response.ok) {
          setIsAuthenticated(true);
          localStorage.setItem("isAuthenticated", "true"); // Persist authentication
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem("isAuthenticated");
        }
      } catch (error) {
        setIsAuthenticated(false);
        localStorage.removeItem("isAuthenticated");
      }
    };

    checkAuthStatus();
  }, []);

  const login = async () => {
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true");
  };

  const logout = async () => {
    try {
      await fetch('https://frontend-take-home-service.fetch.com/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setIsAuthenticated(false);
      localStorage.removeItem("isAuthenticated");
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
