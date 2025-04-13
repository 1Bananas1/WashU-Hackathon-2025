import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Recommendations.css';

// Helper function to render stars (if you want to map numeric rating to star icons)
const renderStars = (rating) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <>
      {[...Array(fullStars)].map((_, i) => <span key={`full-${i}`} className="star filled">★</span>)}
      {halfStar && <span key="half" className="star half">★</span>}
      {[...Array(emptyStars)].map((_, i) => <span key={`empty-${i}`} className="star empty">☆</span>)}
    </>
  );
};

const Recommendations = () => {
  // State to hold recommended restaurants from the backend
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    // Example call to your Flask endpoint
    const fetchRecommendations = async () => {
      try {
        // This example uses a GET route: /recommendations/simple/<user_id>
        // or you might be using the POST route /recommendations/<user_id>
        // Adjust as needed.

        // If using GET:
        // const { data } = await axios.get("http://127.0.0.1:5000/recommendations/user123");

        // If using POST (with lat/lon, etc.):
        // (Uncomment if your server expects a POST with body data.)
        /*
        const { data } = await axios.post("http://127.0.0.1:5000/recommendations/user123", {
          lat: 34.05,
          lon: -118.24,
          radius_value: 2,
          radius_unit: "miles",
          triedFoods: ["Burger Bonanza"]
        });
        */

        // For demonstration, let’s assume a GET route with some sample user_id
        const { data } = await axios.post("http://127.0.0.1:5000/recommendations/user123", {
          lat: 34.05,
          lon: -118.24,
          radius_value: 2,
          radius_unit: "miles",
          triedFoods: []
        });

        // The data structure is presumably { recommendations: [ ... ] }
        if (data && data.recommendations) {
          setRecommendations(data.recommendations);
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      }
    };

    fetchRecommendations();
  }, []);

  return (
    <div className="recommendations-container">
      <div className="recommendations-content">
        <h1 className="recommendations-title">Recommendations</h1>

        <div className="recommendation-bubbles">
          {recommendations.map((rec, index) => (
            <Link
              to={`/restaurant/${rec.restaurant_id || index}`}
              key={rec.restaurant_id || index}
              className="recommendation-bubble-link"
            >
              <div className="recommendation-bubble">
                <div className="bubble-header">
                  <h3 className="bubble-title">{rec.name}</h3>
                  <div className="bubble-rating">
                    {/* If you want to map a numeric "similarity" or "salty" to star rating,
                        you could do something like: renderStars(rec.salty) */}
                    {/* For demonstration, let's suppose rec has a "rating" key or "similarity" */}
                    {renderStars(rec.salty || 3)} 
                  </div>
                </div>
                <div className="bubble-content">
                  <p className="bubble-distance">
                    {rec.vicinity || "Unknown distance"}
                  </p>
                  {/* If your backend returns other fields (like rec.textures, rec.sweet, etc.),
                      you can display them as well */}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Recommendations;