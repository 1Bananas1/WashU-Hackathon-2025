import React from 'react';
import './Recommendations.css';

// Sample data for recommendations
const sampleRecommendations = [
  {
    id: 1,
    title: 'Burger King',
    distance: '0.5 miles',
    rating: 4.2,
  },
  {
    id: 2,
    title: 'Pizza Hut',
    distance: '1.2 miles',
    rating: 4.5,
  },
  {
    id: 3,
    title: 'Taco Bell',
    distance: '0.8 miles',
    rating: 3.9,
  },
  {
    id: 4,
    title: 'Subway',
    distance: '0.3 miles',
    rating: 4.0,
  }
];

const Recommendations = () => {
  return (
    <div className="recommendations-container">
      <div className="recommendations-content">
        <h1>Recommendations</h1>
        
        <div className="recommendation-bubbles">
          {sampleRecommendations.map((recommendation) => (
            <div key={recommendation.id} className="recommendation-bubble">
              <div className="bubble-header">
                <h3 className="bubble-title">{recommendation.title}</h3>
              </div>
              <div className="bubble-content">
                <div className="bubble-info">
                  <span className="bubble-distance">{recommendation.distance}</span>
                  <span className="bubble-rating">★ {recommendation.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
