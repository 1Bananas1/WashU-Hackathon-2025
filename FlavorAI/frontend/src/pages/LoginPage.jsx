import React, { useState } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import API from '../services/api';
import './LoginPage.css';
import logo from '../assets/The_chef_man.png'; // Use actual logo

const LoginPage = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignInWithGoogle = async () => {
    // Development bypass: if in development, skip real auth.
    // You can check process.env.NODE_ENV or a custom flag, for example:
    if (process.env.NODE_ENV === 'development') {
      const testUserId = "user123";
      console.log("Development bypass activated. Using test user:", testUserId);
      localStorage.setItem('userId', testUserId);
      // Optionally, you might prefill test profile data on the backend.
      navigate('/');
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Sign-in successful!", user);

      // Store user ID in local storage
      localStorage.setItem('userId', user.uid);

      // Optionally call your backend to onboard the user
      /*
      await API.post(`/onboarding/${user.uid}`, {
        favorites: [], // or get from user input form
        dietary_restrictions: [],
        allergies: []
      });
      */

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
        {errorMessage && (
          <div className="error-message">{errorMessage}</div>
        )}
        <button
          className="google-signin-button"
          onClick={handleSignInWithGoogle}
          disabled={loading}
        >
          {loading ? "Signing in..." : (
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
          <Link to="/legal">Terms & Privacy</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;