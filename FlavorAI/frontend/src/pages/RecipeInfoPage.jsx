import React from 'react';
import './RecipeInfoPage.css';

const RecipeInfoPage = () => {
  // Sample recipe data
  const recipe = {
    name: 'Chicken Stir Fry',
    ingredients: [
      { name: 'Chicken Breast', quantity: '1 lb', purchaseLocation: 'Grocery Store', price: '$8' },
      { name: 'Broccoli', quantity: '1 head', purchaseLocation: 'Grocery Store', price: '$3' },
      { name: 'Soy Sauce', quantity: '2 tbsp', purchaseLocation: 'Grocery Store', price: '$4' },
    ],
    instructions: [
      'Cut chicken into pieces.',
      'Stir fry chicken and broccoli.',
      'Add soy sauce and cook until done.',
    ],
    nutritionInfo: {
      calories: 350,
      protein: 30,
      fat: 15,
    },
  };

  return (
    <div className="recipe-info-page">
      <h2>{recipe.name}</h2>

      <h3>Ingredients</h3>
      <ul className="ingredients-list">
        {recipe.ingredients.map((ingredient, index) => (
          <li key={index} className="ingredient-item">
            {ingredient.name} - {ingredient.quantity} - Buy at: {ingredient.purchaseLocation} - Price: {ingredient.price}
          </li>
        ))}
      </ul>

      <h3>Instructions</h3>
      <ol className="instructions-list">
        {recipe.instructions.map((instruction, index) => (
          <li key={index}>{instruction}</li>
        ))}
      </ol>

      <h3>Nutrition Information</h3>
      <p>Calories: {recipe.nutritionInfo.calories}, Protein: {recipe.nutritionInfo.protein}g, Fat: {recipe.nutritionInfo.fat}g</p>
    </div>
  );
};

export default RecipeInfoPage;
