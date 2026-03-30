import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import MapDashboard from './pages/MapDashboard';
import { AnimatePresence } from 'motion/react';

function AppContent() {
  const { user } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);

  if (user) {
    return <MapDashboard />;
  }

  return (
    <AnimatePresence mode="wait">
      {isLoginMode ? (
        <Login key="login" onToggleMode={() => setIsLoginMode(false)} />
      ) : (
        <Register key="register" onToggleMode={() => setIsLoginMode(true)} />
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
