import React, { useState } from 'react';
import './SettingsPage.css';

const SettingsPage = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState('english');
  const [accountDetails, setAccountDetails] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
  });

  const handleNotificationsChange = (e) => {
    setNotificationsEnabled(e.target.checked);
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleAccountDetailsChange = (e) => {
    setAccountDetails({
      ...accountDetails,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="settings-page">
      <h2>Settings</h2>

      <h3>Notifications</h3>
      <label>
        <input
          type="checkbox"
          checked={notificationsEnabled}
          onChange={handleNotificationsChange}
        />
        Enable Notifications
      </label>

      <h3>Language</h3>
      <select value={language} onChange={handleLanguageChange}>
        <option value="english">English</option>
        <option value="spanish">Spanish</option>
        <option value="french">French</option>
      </select>

      <h3>Account Details</h3>
      <div>
        <label>Name:</label>
        <input
          type="text"
          name="name"
          value={accountDetails.name}
          onChange={handleAccountDetailsChange}
        />
      </div>
      <div>
        <label>Email:</label>
        <input
          type="email"
          name="email"
          value={accountDetails.email}
          onChange={handleAccountDetailsChange}
        />
      </div>
    </div>
  );
};

export default SettingsPage;
