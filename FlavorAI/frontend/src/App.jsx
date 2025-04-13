// App.jsx
import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation 
} from 'react-router-dom';

// Import your pages and components
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

// AppContent handles routing and uses useLocation so it must be inside Router
const AppContent = ({ userId, setUserId, onboarded, setOnboarded }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  // Redirect logic
  if (!userId && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }
  
  if (userId && !onboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="app">
      {!isLoginPage && <Header setUserId={setUserId} setOnboarded={setOnboarded} />}
      <main className={`main-content ${isLoginPage ? 'login-main' : ''}`}>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={setUserId} />} />
          <Route path="/onboarding" element={<OnboardingPage setOnboarded={setOnboarded} />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isLoginPage && <Footer />}
    </div>
  );
};

function App() {
  // Initialize state from localStorage
  const [userId, setUserId] = useState(localStorage.getItem('userId') || null);
  const [onboarded, setOnboarded] = useState(localStorage.getItem('onboarded') === 'true');

  // Optional: re-check localStorage to update state if needed
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
      <AppContent 
        userId={userId} 
        setUserId={setUserId} 
        onboarded={onboarded} 
        setOnboarded={setOnboarded} 
      />
    </Router>
  );
}

export default App;