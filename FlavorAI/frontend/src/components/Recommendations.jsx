import React from 'react';
import { Link } from 'react-router-dom';
import './Recommendations.css';

// Helper function to render stars based on rating
const renderStars = (rating) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  return (
    <>
      {[...Array(fullStars)].map((_, i) => <span key={`full-${i}`} className="star filled">★</span>)}
      {halfStar && <span key="half" className="star half">★</span>} {/* Placeholder for half star, needs specific CSS */}
      {[...Array(emptyStars)].map((_, i) => <span key={`empty-${i}`} className="star empty">☆</span>)}
    </>
  );
};

// Sample data for recommendations (updated with tags)
const sampleRecommendations = [
  {
    id: 1,
    title: 'Taco Bell',
    distance: '1.5 miles away',
    rating: 4.0, // Example rating
    description: 'Doritos Locos Tacos - Regular',
    tags: ['Crunchy', 'Low Cal', 'Fan Fav']
  },
  {
    id: 2,
    title: 'Raising Canes',
    distance: '7 miles away',
    rating: 3.0, // Example rating
    description: '', // No description in the image
    tags: [] // No tags in the image
  },
  {
    id: 3,
    title: 'Circle K', // Assuming this is a restaurant/food place for the example
    distance: '20 miles away',
    rating: 5.0, // Example rating
    description: '', // No description in the image
    tags: [] // No tags in the image
  }
];

const Recommendations = () => {
  return (
    <div className="recommendations-container">
      <div className="recommendations-content">
        <h1 className="recommendations-title">Recommendations</h1>
        
        <div className="recommendation-bubbles">
          {sampleRecommendations.map((recommendation) => (
            <Link to={`/restaurant/${recommendation.id}`} key={recommendation.id} className="recommendation-bubble-link">
              <div className="recommendation-bubble">
                <div className="bubble-header">
                  <h3 className="bubble-title">{recommendation.title}</h3>
                  <div className="bubble-rating">
                    {renderStars(recommendation.rating)}
                  </div>
                </div>
                <div className="bubble-content">
                  <p className="bubble-distance">{recommendation.distance}</p>
                  {recommendation.description && <p className="bubble-description">{recommendation.description}</p>}
                  {recommendation.tags && recommendation.tags.length > 0 && (
                    <div className="bubble-tags">
                      {recommendation.tags.map((tag, index) => (
                        <span key={index} className="bubble-tag">{tag}</span>
                      ))}
                    </div>
                  )}
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
