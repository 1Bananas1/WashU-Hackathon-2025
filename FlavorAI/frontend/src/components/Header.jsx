import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [isToggled, setIsToggled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggle = () => {
    setIsToggled(!isToggled);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <header className="header">
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
            <span className="toggle-button"></span>
          </label>
        </div>
        <div className="toggle-text">
          {isToggled ? 'Eating at Home' : 'Eating Out'}
        </div>
      </div>
      
      <div className="hamburger-menu" onClick={toggleSidebar}>
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
      </div>

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="close-button" onClick={toggleSidebar}>×</div>
        </div>
        <div className="sidebar-content">
          <Link to="/" className="sidebar-item" onClick={toggleSidebar}>Main Menu</Link>
          <Link to="/profile" className="sidebar-item" onClick={toggleSidebar}>Profile</Link>
          <Link to="/settings" className="sidebar-item" onClick={toggleSidebar}>Settings</Link>
        </div>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
    </header>
  );
};

export default Header;
