import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import Select from 'react-select';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [foodPreferences, setFoodPreferences] = useState([]);
  const [allergies, setAllergies] = useState('');
  const [timelineData, setTimelineData] = useState(null);
  const [error, setError] = useState('');

  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  const foodOptions = [
    { value: 'italian', label: 'Italian' },
    { value: 'mexican', label: 'Mexican' },
    { value: 'chinese', label: 'Chinese' },
    { value: 'american', label: 'American' },
    { value: 'indian', label: 'Indian' },
    { value: 'japanese', label: 'Japanese' },
    { value: 'thai', label: 'Thai' },
    { value: 'french', label: 'French' },
    { value: 'korean', label: 'Korean' },
    { value: 'vietnamese', label: 'Vietnamese' },
  ];

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleFoodPreferencesChange = (selectedOptions) => {
    setFoodPreferences(selectedOptions);
  };

  const handleAllergiesChange = (e) => {
    setAllergies(e.target.value);
  };

  const handleTimelineUpload = (e) => {
    const file = e.target.files[0];
    // Implement file reading and processing here
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTimelineData(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Handle successful sign-in (e.g., redirect to profile page)
      console.log("Sign-in successful!");
      setError('');
    } catch (error) {
      setError(error.message);
      console.error("Sign-in error:", error.message);
    }
  };

  const handleSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Handle successful sign-up (e.g., redirect to profile page)
      console.log("Sign-up successful!");
      setError('');
    } catch (error) {
      setError(error.message);
      console.error("Sign-up error:", error.message);
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      // The signed-in user info.
      const user = result.user;
      // IdP data available using getAdditionalUserInfo(result)
      // ...
      console.log("Sign-in with Google successful!", user, token);
      setError('');
    } catch (error) {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.customData.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      // ...
      setError(errorMessage);
      console.error("Sign-in with Google error:", errorCode, errorMessage, email, credential);
    }
  };

  return (
    <div className="login-page">
      <div className="login-form">
        <h2>Login / Sign Up</h2>
        {error && <p className="error-message">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={handleEmailChange}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={handlePasswordChange}
        />
        <button onClick={handleSignIn}>Sign In</button>
        <button onClick={handleSignUp}>Sign Up</button>
        <button onClick={handleSignInWithGoogle}>Sign in with Gmail</button>

        <h3>Food Preferences</h3>
        <Select
          isMulti
          options={foodOptions}
          value={foodPreferences}
          onChange={handleFoodPreferencesChange}
          placeholder="Select your food preferences"
        />

        <h3>Allergies</h3>
        <input
          type="text"
          placeholder="Allergies (comma-separated)"
          value={allergies}
          onChange={handleAllergiesChange}
        />

        <h3>Upload Google Maps Timeline (Optional)</h3>
        <input type="file" accept=".json,.kml" onChange={handleTimelineUpload} />

        {timelineData && (
          <p>Timeline data uploaded.</p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
