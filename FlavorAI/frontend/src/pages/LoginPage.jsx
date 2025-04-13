import React from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import API from '../services/api'; // If you want to call your backend
import './LoginPage.css';
import logo from '../assets/The_chef_man.png'; // Use actual logo

const LoginPage = () => {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const navigate = useNavigate();

  // Example: handle sign-in
  const handleSignInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Sign-in successful!", user);

      // Suppose you want to store user in localStorage
      localStorage.setItem('userId', user.uid);

      // Possibly inform your Flask backend that user exists (optional)
      // e.g. Onboard them if needed
      // await API.post(`/onboarding/${user.uid}`, {
      //   favorites: ["Pizza", "Sushi"], // or gather from a form
      //   dietary_restrictions: [],
      //   allergies: []
      // });

      // Then navigate to "/"
      navigate('/');
    } catch (error) {
      console.error("Sign-in error:", error.message);
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
        <button className="google-signin-button" onClick={handleSignInWithGoogle}>
          <img 
            src="../src/assets/Google__G__logo.svg.webp"
            alt="Google Logo" 
            className="google-logo" 
          />
          Login with Google
        </button>
        <p className="terms-and-conditions">
          Terms and Conditions
        </p>
      </div>
    </div>
  );
};

export default LoginPage;