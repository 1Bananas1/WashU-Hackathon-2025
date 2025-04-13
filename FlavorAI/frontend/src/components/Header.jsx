import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import logo from '../assets/The_chef_man.png';

const Header = ({ setUserId, setOnboarded }) => {
  const [isToggled, setIsToggled] = useState(false); // false = Eating Out, true = Stay In
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Retrieve current userId from localStorage
  const userId = localStorage.getItem('userId');

  // Toggle between "Eating Out" and "Stay In"
  const handleToggle = () => {
    setIsToggled(!isToggled);
  };

  // Toggle the sidebar open/closed
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Logout logic (called when user clicks Logout menu item)
  const handleLogout = () => {
    // Close sidebar if open
    toggleSidebar();

    // Remove from localStorage
    localStorage.removeItem('userId');
    localStorage.removeItem('onboarded');

    // Update parent states
    setUserId(null);
    setOnboarded(false);

    // Navigate to the login page
    navigate('/login');
  };

  return (
    <header className="header">
      {/* Toggle Switch */}
      <div className="toggle-container">
        <div className="toggle-switch">
          <input
            type="checkbox"
            id="toggle"
            className="toggle-input"
            checked={isToggled}
            onChange={handleToggle}
          />
          <label htmlFor="toggle" className="toggle-label">
            <span className="toggle-text-inside">
              {isToggled ? 'Stay In' : 'Eating Out'}
            </span>
            <span className="toggle-button"></span>
          </label>
        </div>
      </div>

      {/* Logo in the Center */}
      <div className="header-logo-container">
        <img src={logo} alt="FlavorAI Logo" className="header-logo" />
      </div>

      {/* Settings Icon (opens sidebar) */}
      <div className="settings-icon" onClick={toggleSidebar}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </div>

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="close-button" onClick={toggleSidebar}>×</div>
        </div>
        <div className="sidebar-content">
          {userId ? (
            // If user is logged in, show Logout
            <div className="sidebar-item" onClick={handleLogout}>
              Logout
            </div>
          ) : (
            // Otherwise, show Login link
            <Link to="/login" className="sidebar-item" onClick={toggleSidebar}>
              Login
            </Link>
          )}
          <Link to="/" className="sidebar-item" onClick={toggleSidebar}>Main Menu</Link>
          <Link to="/profile" className="sidebar-item" onClick={toggleSidebar}>Profile</Link>
          <Link to="/taste-profile" className="sidebar-item" onClick={toggleSidebar}>Taste Profile</Link>
          <Link to="/settings" className="sidebar-item" onClick={toggleSidebar}>Settings</Link>
          <Link to="/legal" className="sidebar-item" onClick={toggleSidebar}>Legal</Link>
        </div>
      </div>

      {/* Overlay (clicking on it also closes sidebar) */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
    </header>
  );
};

export default Header;