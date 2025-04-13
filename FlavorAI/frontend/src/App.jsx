import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import Recommendations from './components/Recommendations';
import ProfilePage from './pages/ProfilePage';
import RestaurantInfoPage from './pages/RestaurantInfoPage';
import RecipeInfoPage from './pages/RecipeInfoPage';
import SettingsPage from './pages/SettingsPage';
import TasteProfilePage from './pages/TasteProfilePage';
import LegalPage from './pages/LegalPage';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';

const AppContent = ({ userId, setUserId, onboarded, setOnboarded }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="app">
      {!isLoginPage && <Header setUserId={setUserId} setOnboarded={setOnboarded} />}
      <main className={`main-content ${isLoginPage ? 'login-main' : ''}`}>
        <Routes>
          {/* If no user is logged in, redirect to /login */}
          {!userId && <Route path="*" element={<Navigate to="/login" replace />} />}

          {/* If user is logged in but not onboarded, force all routes to OnboardingPage */}
          {userId && !onboarded && <Route path="*" element={<OnboardingPage />} />}

          {/* If user is logged in and onboarded, render the protected routes */}
          {userId && onboarded && (
            <>
              <Route path="/" element={<Recommendations />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/restaurant/:id" element={<RestaurantInfoPage />} />
              <Route path="/recipe/:id" element={<RecipeInfoPage />} />
              <Route path="/taste-profile" element={<TasteProfilePage />} />
              <Route path="/legal" element={<LegalPage />} />
            </>
          )}

          {/* Login route. Pass onLogin so LoginPage can update user state */}
          <Route path="/login" element={<LoginPage onLogin={setUserId} />} />
        </Routes>
      </main>
      {!isLoginPage && <Footer />}
    </div>
  );
};

function App() {
  // Initialize with localStorage values
  const [userId, setUserId] = useState(localStorage.getItem('userId') || null);
  const [onboarded, setOnboarded] = useState(localStorage.getItem('onboarded') === 'true');

  // Optionally, re-check localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId && storedUserId !== userId) {
      setUserId(storedUserId);
    }
    const storedOnboarded = localStorage.getItem('onboarded') === 'true';
    if (storedOnboarded !== onboarded) {
      setOnboarded(storedOnboarded);
    }
  }, [userId, onboarded]);

  return (
    <Router>
      <AppContent userId={userId} setUserId={setUserId} onboarded={onboarded} setOnboarded={setOnboarded} />
    </Router>
  );
}

export default App;