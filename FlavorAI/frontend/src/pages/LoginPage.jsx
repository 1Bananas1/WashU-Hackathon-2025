import React, { useState } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import logo from '../assets/The_chef_man.png';
import app from "../config/firebase"; // Import the Firebase app instance

const LoginPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const auth = getAuth(app); // Add this line to initialize auth
  const provider = new GoogleAuthProvider();

  // Function to handle Google Sign-In
  const handleSignInWithGoogle = async () => {
    try {
      setError(null); // Clear any previous errors
      const result = await signInWithPopup(auth, provider);
      // Handle successful sign-in
      const user = result.user;
      console.log("Sign-in with Google successful!", user);
      navigate('/'); // Redirect to main app page after login
    } catch (error) {
      // Handle errors
      console.error("Sign-in with Google error:", error.message);
      setError(error.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-content">
        {/* Logo Section */}
        <div className="logo-container">
          <img src={logo} alt="FlavorAI Logo" className="login-logo" />
        </div>

        {/* Tagline */}
        <p className="tagline">
          Find Your Flavor – Recipes and Restaurants Tailored for You!
        </p>

        {/* Error message display */}
        {error && <p className="error-message">{error}</p>}

        {/* Google Sign-in Button */}
        <button className="google-signin-button" onClick={handleSignInWithGoogle}>
          <img 
            src="../src/assets/Google__G__logo.svg.webp"
            alt="Google Logo" 
            className="google-logo" 
          />
          Login with Google
        </button>

        {/* Terms and Conditions */}
        <p className="terms-and-conditions">
          Terms and Conditions
        </p>
      </div>
    </div>
  );
};

export default LoginPage;