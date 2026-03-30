import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  username: string;
  visitedCountries: string[];
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  register: (username: string, password: string) => boolean;
  logout: () => void;
  markVisited: (countryId: string) => void;
  unmarkVisited: (countryId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (username: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find((u: any) => u.username === username && u.password === password);
    
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const register = (username: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find((u: any) => u.username === username)) {
      return false; // User already exists
    }
    
    const newUser = {
      id: Date.now().toString(),
      username,
      password,
      visitedCountries: []
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const updateStoredUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map((u: any) => u.id === updatedUser.id ? { ...u, visitedCountries: updatedUser.visitedCountries } : u);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  const markVisited = (countryId: string) => {
    if (!user) return;
    if (!user.visitedCountries.includes(countryId)) {
      const updatedUser = { ...user, visitedCountries: [...user.visitedCountries, countryId] };
      updateStoredUser(updatedUser);
    }
  };

  const unmarkVisited = (countryId: string) => {
    if (!user) return;
    const updatedUser = { ...user, visitedCountries: user.visitedCountries.filter(id => id !== countryId) };
    updateStoredUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, markVisited, unmarkVisited }}>
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
