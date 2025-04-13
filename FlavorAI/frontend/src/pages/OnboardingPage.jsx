import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import './OnboardingPage.css';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId') || "testUser";
  
  // Use multi-line text fields where each line is treated as one entry
  const [favoritesText, setFavoritesText] = useState('');
  const [dietaryText, setDietaryText] = useState('');
  const [allergiesText, setAllergiesText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Convert text areas to arrays by splitting by newline and trimming
    const favorites = favoritesText.split('\n').map(item => item.trim()).filter(item => item);
    const dietaryRestrictions = dietaryText.split('\n').map(item => item.trim()).filter(item => item);
    const allergies = allergiesText.split('\n').map(item => item.trim()).filter(item => item);

    if (favorites.length === 0) {
      setError('Please enter at least one favorite food.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requestBody = {
        favorites: favorites,
        dietary_restrictions: dietaryRestrictions,
        allergies: allergies
      };

      const { data } = await API.post(`/onboarding/${userId}`, requestBody);
      
      // Optionally, store a flag to indicate onboarding is complete
      localStorage.setItem('onboarded', 'true');
      
      // Navigate to the main page (or recommendations)
      navigate('/');
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