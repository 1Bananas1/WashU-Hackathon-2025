import React from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import './LoginPage.css';
import logo from '../assets/The_chef_man.png'; // Use the actual logo

const LoginPage = () => {
  const auth = getAuth(); // Initialize Firebase Auth
  const provider = new GoogleAuthProvider(); // Google Auth Provider

  // Function to handle Google Sign-In
  const handleSignInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      // Handle successful sign-in
      const user = result.user;
      console.log("Sign-in with Google successful!", user);
      // TODO: Redirect user or update app state upon successful login
    } catch (error) {
      // Handle errors
      console.error("Sign-in with Google error:", error.message);
      // TODO: Display user-friendly error message
    }
  };

  return (
    <div className="login-page">
      <div className="login-content">
        {/* Logo Section */}
        <div className="logo-container">
          <img src={logo} alt="FlavorAI Logo" className="login-logo" />
          {/* Removed the separate logo text span as it seems integrated in the new logo */}
        </div>

        {/* Tagline */}
        <p className="tagline">
          Find Your Flavor – Recipes and Restaurants Tailored for You!
        </p>

        {/* Google Sign-in Button */}
        <button className="google-signin-button" onClick={handleSignInWithGoogle}>
          <img 
            src="../src/assets/Google__G__logo.svg.webp" // Use the local Google logo
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
