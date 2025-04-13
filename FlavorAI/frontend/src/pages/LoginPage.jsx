import React, { useState } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import API from '../services/api'; // If you want to call your backend
import './LoginPage.css';
import logo from '../assets/The_chef_man.png'; // Use actual logo

const LoginPage = () => {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const navigate = useNavigate();

  // Local UI states
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignInWithGoogle = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Sign-in successful!", user);

      // Store user ID in local storage (or any other global state approach)
      localStorage.setItem('userId', user.uid);

      // OPTIONAL: Suppose you want to create a user profile on the backend:
      /*
      try {
        await API.post(`/onboarding/${user.uid}`, {
          favorites: [], // or get from a form
          dietary_restrictions: [],
          allergies: []
        });
      } catch (onboardingError) {
        console.error("Error onboarding user:", onboardingError);
      }
      */

      // Navigate to home page or recommendations
      navigate('/');
    } catch (error) {
      console.error("Sign-in error:", error.message);
      setErrorMessage("Failed to sign in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-content">
        <div className="logo-container">
          <img src={logo} alt="FlavorAI Logo" className="login-logo" />
        </div>

        <p className="tagline">
          Find Your Flavor – Recipes and Restaurants Tailored for You!
        </p>

        {/* If there's an error, display it */}
        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}

        {/* Google sign-in button */}
        <button
          className="google-signin-button"
          onClick={handleSignInWithGoogle}
          disabled={loading}
        >
          {loading ? (
            "Signing in..."
          ) : (
            <>
              <img 
                src="../src/assets/Google__G__logo.svg.webp"
                alt="Google Logo" 
                className="google-logo" 
              />
              Login with Google
            </>
          )}
        </button>

        <p className="terms-and-conditions">
          <a href="/terms" className="terms-link">Terms and Conditions</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;