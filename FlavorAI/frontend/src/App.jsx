import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
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

  return (
    <div className="app">
      {!isLoginPage && <Header />}
      <main className={`main-content ${isLoginPage ? 'login-main' : ''}`}>
        <Routes>
          <Route path="/" element={<Recommendations />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/restaurant/:id" element={<RestaurantInfoPage />} />
          <Route path="/recipe/:id" element={<RecipeInfoPage />} />
          <Route path="/taste-profile" element={<TasteProfilePage />} />
          <Route path="/legal" element={<LegalPage />} />
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