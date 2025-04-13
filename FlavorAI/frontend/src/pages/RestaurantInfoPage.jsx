import React from 'react';
import './RestaurantInfoPage.css';

const RestaurantInfoPage = () => {
  // Sample restaurant data
  const restaurant = {
    name: 'McDonalds',
    reviews: [
      { user: 'User1', rating: 4, comment: 'Good food' },
      { user: 'User2', rating: 3, comment: 'Average' },
    ],
    menus: [
      { category: 'Burgers', items: ['Big Mac', 'Quarter Pounder'] },
      { category: 'Sides', items: ['Fries', 'Apple Pie'] },
    ],
    contact: {
      phone: '+1-555-123-4567',
      address: '123 Main St',
    },
    recommendedItems: ['Big Mac', 'Fries'],
    nutritionInfo: {
      'Big Mac': { calories: 540, fat: 28 },
      'Fries': { calories: 230, fat: 11 },
    },
  };

  return (
    <div className="restaurant-info-page">
      <h2>{restaurant.name}</h2>

      <h3>Reviews</h3>
      <div className="reviews-section">
        {restaurant.reviews.map((review, index) => (
          <div key={index} className="review-item">
            <p><b>{review.user}:</b> {review.comment} - {review.rating} stars</p>
          </div>
        ))}
      </div>

      <h3>Menus</h3>
      <div className="menus-section">
        {restaurant.menus.map((menu, index) => (
          <div key={index} className="menu-category">
            <h4>{menu.category}</h4>
            <ul>
              {menu.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h3>Contact</h3>
      <p>Phone: {restaurant.contact.phone}</p>
      <p>Address: {restaurant.contact.address}</p>

      <h3>Recommended Items</h3>
      <ul className="recommended-items">
        {restaurant.recommendedItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      <h3>Nutrition Information</h3>
      <div className="nutrition-info">
        {Object.entries(restaurant.nutritionInfo).map(([item, info]) => (
          <div key={item} className="nutrition-item">
            <h4>{item}</h4>
            <p>Calories: {info.calories}, Fat: {info.fat}g</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RestaurantInfoPage;
