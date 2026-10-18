// src/lib/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Send HTTP-only cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Helper to extract safe, user-friendly error message from API response
 */
export const getErrorMessage = (error, defaultMsg = 'An unexpected error occurred.') => {
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  if (error.message) {
    if (error.message === 'Network Error') {
      return 'Unable to connect to the NiveshGuard safety server. Please ensure the backend is running.';
    }
    return error.message;
  }
  return defaultMsg;
};

export default api;
