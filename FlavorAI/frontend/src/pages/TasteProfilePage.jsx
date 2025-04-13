import React, { useEffect, useState } from 'react';
import API from '../services/api';
import './TasteProfilePage.css';

const TasteProfilePage = () => {
  const [tasteProfile, setTasteProfile] = useState(null);
  const userId = localStorage.getItem('userId'); // Retrieve user ID from localStorage

  useEffect(() => {
    const fetchTasteProfile = async () => {
      try {
        const { data } = await API.get(`/userprofile/${userId}`);
        setTasteProfile(data.favorite_tastes);
      } catch (err) {
        console.error('Error fetching taste profile:', err);
      }
    };

    fetchTasteProfile();
  }, [userId]);

  if (!tasteProfile) {
    return <div>Loading taste profile...</div>;
  }

  return (
    <div className="taste-profile-page">
      <h2>Your Taste Profile</h2>
      <div className="taste-bars">
        {Object.entries(tasteProfile).map(([taste, value]) => (
          <div key={taste} className="taste-bar">
            <label>{taste.charAt(0).toUpperCase() + taste.slice(1)}</label>
            <div className="progress-bar">
              <div
                className="progress"
                style={{ width: `${value * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TasteProfilePage;