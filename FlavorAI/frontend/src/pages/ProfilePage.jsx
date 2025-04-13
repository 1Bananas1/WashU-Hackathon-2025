import React, { useEffect, useState } from 'react';
import { getAuth } from "firebase/auth";
import API from '../services/api';
import './ProfilePage.css';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [error, setError] = useState("");
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await API.get(`/userprofile/${userId}`);
        setProfile(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load user profile.");
      }
    };

    if (userId) {
      // Fetch profile from backend CSV
      fetchProfile();
      // Also set Firebase user details (if available)
      const auth = getAuth();
      setFirebaseUser(auth.currentUser);
    }
  }, [userId]);

  if (error) {
    return <div className="profile-page"><p className="error-message">{error}</p></div>;
  }

  if (!profile) {
    return <div className="profile-page"><p>Loading profile...</p></div>;
  }

  // Use Firebase user details if available; else fallback to CSV info
  const displayName = firebaseUser?.displayName || profile.user_id;
  const photoURL = firebaseUser?.photoURL || 'https://via.placeholder.com/150';

  const { favorite_tastes, texture_preferences, dietary_restrictions, allergies } = profile;

  return (
    <div className="profile-page">
      <h2>Profile</h2>
      <div className="profile-card">
        <img src={photoURL} alt="Profile" className="profile-picture" />
        <h3>{displayName}</h3>
        <div className="profile-details">
          <h4>Texture Preferences:</h4>
          <p>{texture_preferences.length > 0 ? texture_preferences.join(', ') : 'None'}</p>
          <h4>Dietary Restrictions:</h4>
          <p>{dietary_restrictions.length > 0 ? dietary_restrictions.join(', ') : 'None'}</p>
          <h4>Allergies:</h4>
          <p>{allergies.length > 0 ? allergies.join(', ') : 'None'}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;