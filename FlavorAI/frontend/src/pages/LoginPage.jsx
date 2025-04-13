// pages/LoginPage.jsx
import React, { useState } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import logo from '../assets/The_chef_man.png';

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignInWithGoogle = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Sign-in successful!", user);

      localStorage.setItem('userId', user.uid);
      onLogin(user.uid);  // update global state via prop

      // Navigate to home page (or force onboarding if first-time)
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
        <p className="tagline">Find Your Flavor – Recipes and Restaurants Tailored for You!</p>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        <button className="google-signin-button" onClick={handleSignInWithGoogle} disabled={loading}>
          {loading ? "Signing in..." : "Login with Google"}
        </button>
        <p className="terms-and-conditions">
          <a href="/legal">Legal Documents</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;