// services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:5000', // or wherever Flask is
});

// If you want to add interceptors for tokens, etc., do so here
// API.interceptors.request.use((config) => { ... });

// Export the instance
export default API;