import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api';
import './RestaurantInfoPage.css';

const RestaurantInfoPage = () => {
  const { id } = useParams(); // Google place_id or other restaurant ID
  const [restaurant, setRestaurant] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        // Call GET /restaurant/<id> to get details from your Flask route
        const { data } = await API.get(`/restaurant/${id}`);
        setRestaurant(data);
      } catch (err) {
        console.error("Error fetching restaurant info:", err);
        setError("Failed to load restaurant details. Please try again later.");
      }
    };

    fetchRestaurant();
  }, [id]);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!restaurant) {
    return <div>Loading restaurant...</div>;
  }

  return (
    <div className="restaurant-info-page">
      <h2>{restaurant.name}</h2>

      {/* Address & Phone */}
      {restaurant.address && (
        <p>
          <strong>Address:</strong> {restaurant.address}
        </p>
      )}
      {restaurant.phone && (
        <p>
          <strong>Phone:</strong> {restaurant.phone}
        </p>
      )}

      {/* Website */}
      {restaurant.website && (
        <p>
          <strong>Website:</strong>{" "}
          <a href={restaurant.website} target="_blank" rel="noreferrer">
            {restaurant.website}
          </a>
        </p>
      )}

      {/* Opening Hours */}
      {restaurant.opening_hours && restaurant.opening_hours.length > 0 && (
        <div className="opening-hours-section">
          <h3>Opening Hours</h3>
          <ul>
            {restaurant.opening_hours.map((day, index) => (
              <li key={index}>{day}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Reviews */}
      {restaurant.reviews && restaurant.reviews.length > 0 && (
        <div className="reviews-section">
          <h3>User Reviews</h3>
          {restaurant.reviews.map((rev, i) => (
            <div key={i} className="review-item">
              <strong>{rev.user}</strong> ({rev.rating} stars): {rev.comment}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RestaurantInfoPage;