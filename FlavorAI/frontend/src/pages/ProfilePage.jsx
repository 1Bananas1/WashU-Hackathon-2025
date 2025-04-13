import React from 'react';
import './ProfilePage.css';

const ProfilePage = () => {
  // Sample user data
  const user = {
    name: 'John Doe',
    profilePicture: 'https://via.placeholder.com/150', // Replace with actual image URL
    favoriteFood: 'Pizza',
  };

  return (
    <div className="profile-page">
      <h2>Profile</h2>
      <div className="profile-card">
        <img src={user.profilePicture} alt="Profile" className="profile-picture" />
        <h3>{user.name}</h3>
        <p>Favorite Food: {user.favoriteFood}</p>
      </div>
    </div>
  );
};

export default ProfilePage;
