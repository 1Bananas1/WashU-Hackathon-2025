import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import RestaurantInfoPage from './pages/RestaurantInfoPage';
import RecipeInfoPage from './pages/RecipeInfoPage';
import Recommendations from './components/Recommendations';
import TasteProfilePage from './pages/TasteProfilePage';
import Header from './components/Header';
import Footer from './components/Footer';
import LegalPage from './pages/LegalPage';
import './App.css';

const AppContent = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const userId = localStorage.getItem('userId'); // Check if user is logged in

  return (
    <div className="app">
      {!isLoginPage && <Header />}
      <main className={`main-content ${isLoginPage ? 'login-main' : ''}`}>
        <Routes>
          {/* If a user is logged in, show the main menu (Recommendations), otherwise redirect to login */}
          <Route path="/" element={userId ? <Recommendations /> : <Navigate to="/login" replace />} />

          {/* When a user tries to access /login while logged in, redirect them to the main menu */}
          <Route path="/login" element={userId ? <Navigate to="/" replace /> : <LoginPage />} />

          {/* Protect other routes similarly */}
          <Route path="/settings" element={userId ? <SettingsPage /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={userId ? <ProfilePage /> : <Navigate to="/login" replace />} />
          <Route path="/restaurant/:id" element={userId ? <RestaurantInfoPage /> : <Navigate to="/login" replace />} />
          <Route path="/recipe/:id" element={userId ? <RecipeInfoPage /> : <Navigate to="/login" replace />} />
          <Route path="/taste-profile" element={userId ? <TasteProfilePage /> : <Navigate to="/login" replace />} />
          <Route path="/legal" element={userId ? <LegalPage /> : <Navigate to="/login" replace />} />
        </Routes>
      </main>
      {!isLoginPage && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
