import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import './Recommendations.css';

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const userId = localStorage.getItem('userId');

  // Two sliders: radius in miles, number of recommendations
  const [radius, setRadius] = useState(3);
  const [numRecs, setNumRecs] = useState(5);

  const handleRadiusChange = (e) => {
    setRadius(Number(e.target.value));
  };

  const handleNumRecsChange = (e) => {
    setNumRecs(Number(e.target.value));
  };

  useEffect(() => {
    if (!userId) {
      console.log("No user logged in!");
      return;
    }

    const fetchRecommendations = async () => {
      try {
        // We include 'n' in our POST body so the server can return exactly that many results
        const requestBody = {
          lat: 38.6270,
          lon: -90.1994,
          radius_value: radius,
          radius_unit: "miles",
          triedFoods: [],
          n: numRecs, // new
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
  }, [userId, radius, numRecs]);

  return (
    <div className="recommendations-container">
      <div className="recommendations-content">
        <h1 className="recommendations-title">Recommendations</h1>

        {/* Slider Controls */}
        <div className="slider-controls">
          {/* Search Radius Slider */}
          <div className="slider-group">
            <label htmlFor="radiusRange">
              Search Radius: <strong>{radius}</strong> miles
            </label>
            <input
              id="radiusRange"
              type="range"
              min="1"
              max="10"
              value={radius}
              onChange={handleRadiusChange}
              className="slider radius-slider"
            />
          </div>

          {/* Number of Recommendations Slider */}
          <div className="slider-group">
            <label htmlFor="numRecsRange">
              Number of Results: <strong>{numRecs}</strong>
            </label>
            <input
              id="numRecsRange"
              type="range"
              min="1"
              max="20"
              value={numRecs}
              onChange={handleNumRecsChange}
              className="slider numrecs-slider"
            />
          </div>
        </div>

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
                </div>
                <div className="bubble-content">
                  <p className="bubble-distance">
                    {rec.vicinity || "Unknown location"}
                  </p>
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