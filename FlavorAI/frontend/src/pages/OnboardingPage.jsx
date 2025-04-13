// OnboardingPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import './OnboardingPage.css';

const OnboardingPage = ({ setOnboarded }) => {
  const navigate = useNavigate();

  // Default userId to what's in localStorage, or "testUser"
  const existingUserId = localStorage.getItem('userId');
  const [userId] = useState(existingUserId || 'testUser');

  const [favoritesText, setFavoritesText] = useState('');
  const [dietaryText, setDietaryText] = useState('');
  const [allergiesText, setAllergiesText] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const favorites = favoritesText
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item);

    const dietaryRestrictions = dietaryText
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item);

    const allergies = allergiesText
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item);

    if (favorites.length === 0) {
      setError('Please enter at least one favorite food.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requestBody = {
        favorites,
        dietary_restrictions: dietaryRestrictions,
        allergies,
      };

      // POST call
      await API.post(`/onboarding/${userId}`, requestBody);

      // Mark the user as onboarded in localStorage
      localStorage.setItem('onboarded', 'true');
      localStorage.setItem('userId', userId);

      // Update the parent's onboarded state
      setOnboarded(true);

      // Go to /dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error during onboarding:', err);
      setError('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page">
      <h1>Welcome to TasteAI!</h1>
      <p>Create your personalized profile by letting us know your favorite foods and any dietary needs.</p>

      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="onboarding-form">
        <label>
          Favorite Foods (one per line):
          <textarea
            value={favoritesText}
            onChange={(e) => setFavoritesText(e.target.value)}
            placeholder="Pizza&#10;Sushi&#10;Tacos"
          />
        </label>

        <label>
          Dietary Restrictions (one per line, leave blank if none):
          <textarea
            value={dietaryText}
            onChange={(e) => setDietaryText(e.target.value)}
            placeholder="Gluten-free&#10;Halal"
          />
        </label>

        <label>
          Allergies (one per line, leave blank if none):
          <textarea
            value={allergiesText}
            onChange={(e) => setAllergiesText(e.target.value)}
            placeholder="Nuts&#10;Shellfish"
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating Profile...' : 'Create My Profile'}
        </button>
      </form>
    </div>
  );
};

export default OnboardingPage;