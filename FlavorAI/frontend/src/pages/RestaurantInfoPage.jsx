import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api';
import './RestaurantInfoPage.css';

const RestaurantInfoPage = () => {
  const { id } = useParams(); // from URL /restaurant/:id
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const { data } = await API.get(`/restaurant/${id}`);
        setRestaurant(data);
      } catch (err) {
        console.error("Error fetching restaurant info:", err);
      }
    };
    fetchRestaurant();
  }, [id]);

  if (!restaurant) {
    return <div>Loading restaurant...</div>;
  }

  return (
    <div className="restaurant-info-page">
      <h2>{restaurant.name}</h2>
      {/* Remainder of your UI: reviews, menus, recommendedItems, etc. */}
      ...
    </div>
  );
};

export default RestaurantInfoPage;