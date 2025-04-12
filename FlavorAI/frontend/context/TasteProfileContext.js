import React, { createContext, useState, useContext } from 'react';

// Create the context
const TasteProfileContext = createContext();

// Custom hook to use the context
export const useTasteProfile = () => useContext(TasteProfileContext);

// Provider component
export const TasteProfileProvider = ({ children }) => {
  // State for user data, raw data from Google takeout
  const [userData, setUserData] = useState(null);
  
  // State for the analyzed taste profile
  const [tasteProfile, setTasteProfile] = useState(null);
  
  // State for restaurant recommendations
  const [recommendations, setRecommendations] = useState([]);

  // Function to process the Google Takeout data and generate a taste profile
  const processUserData = (data) => {
    // In a real app, this would be a complex analysis of the Google Takeout data
    // For the hackathon, we'll simulate this process
    
    console.log("Processing user data:", data.name);
    
    // Simulate processing delay
    setTimeout(() => {
      // Create a mock taste profile based on the simulated data analysis
      const mockTasteProfile = {
        spicePreference: 'Medium-High',
        saltPreference: 'High',
        sweetnessPreference: 'Low',
        bitterPreference: 'Medium',
        sourPreference: 'Medium-High',
        umamiPreference: 'High',
        favoriteEthnicCuisines: ['Thai', 'Mexican', 'Italian'],
        dietaryRestrictions: ['No shellfish'],
        frequentlyOrderedDishes: ['Pad Thai', 'Tacos', 'Pizza'],
        visitFrequency: {
          breakfast: 'Low',
          lunch: 'High',
          dinner: 'Medium',
          dessert: 'Low'
        }
      };
      
      setTasteProfile(mockTasteProfile);
      
      // Generate mock recommendations based on the taste profile
      generateRecommendations(mockTasteProfile);
    }, 2000);
  };
  
  // Function to generate restaurant recommendations based on taste profile
  const generateRecommendations = (profile) => {
    // In a real app, this would query a database or API based on the taste profile
    // For the hackathon, we'll use mock data
    
    const mockRecommendations = [
      {
        id: '1',
        name: 'Thai Delight',
        rating: 4.8,
        cuisine: 'Thai',
        description: 'Authentic Thai cuisine with customizable spice levels',
        matchReasons: ['Matches your spice preference', 'One of your preferred cuisines'],
        distance: '1.2 miles',
        priceLevel: '$$',
        topDishes: ['Pad Thai', 'Green Curry', 'Tom Yum Soup']
      },
      {
        id: '2',
        name: 'El Taqueria',
        rating: 4.6,
        cuisine: 'Mexican',
        description: 'Family-owned taco shop with homemade salsas',
        matchReasons: ['Matches your salt preference', 'One of your preferred cuisines'],
        distance: '0.8 miles',
        priceLevel: '$',
        topDishes: ['Street Tacos', 'Carne Asada Fries', 'Horchata']
      },
      {
        id: '3',
        name: 'Umami Burger',
        rating: 4.5,
        cuisine: 'American',
        description: 'Gourmet burgers focusing on umami-rich ingredients',
        matchReasons: ['Matches your umami preference', 'Savory options with low sweetness'],
        distance: '1.5 miles',
        priceLevel: '$$',
        topDishes: ['Truffle Burger', 'Umami Burger', 'Parmesan Fries']
      },
      {
        id: '4',
        name: 'Spice Garden',
        rating: 4.7,
        cuisine: 'Indian',
        description: 'Traditional Indian dishes with authentic spices',
        matchReasons: ['Matches your spice preference', 'Rich in flavor complexity'],
        distance: '2.0 miles',
        priceLevel: '$$',
        topDishes: ['Butter Chicken', 'Lamb Vindaloo', 'Garlic Naan']
      }
    ];
    
    setRecommendations(mockRecommendations);
  };

  // Value object that will be provided to consumers of this context
  const value = {
    userData,
    setUserData,
    tasteProfile,
    setTasteProfile,
    recommendations,
    setRecommendations,
    processUserData,
    generateRecommendations
  };

  return (
    <TasteProfileContext.Provider value={value}>
      {children}
    </TasteProfileContext.Provider>
  );
};