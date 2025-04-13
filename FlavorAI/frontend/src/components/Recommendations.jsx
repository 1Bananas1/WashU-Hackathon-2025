import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Recommendations.css';
import API from '../services/api'; // using the instance

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const userId = localStorage.getItem('userId'); // or some other mechanism

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!userId) {
        console.log("No user logged in!");
        return;
      }
      try {
        // Example: use lat/lon from your app state or default
        const requestBody = {
          lat: 38.6270,
          lon: -90.1994,
          radius_value: 3,
          radius_unit: "miles",
          triedFoods: []
        };
        const { data } = await API.post(`/recommendations/${userId}`, requestBody);
        if (data && data.recommendations) {
          setRecommendations(data.recommendations);
        }
      } catch (err) {
        console.error("Error fetching recommendations:", err);
      }
    };

    fetchRecommendations();
  }, [userId]);

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
                  {/* If you want star logic, do something like:
                      {renderStars(someRatingValue)}
                  */}
                </div>
                <div className="bubble-content">
                  <p className="bubble-distance">{rec.vicinity || "Unknown location"}</p>
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