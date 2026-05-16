import axios from "axios";

// Axios instance pointing to Express API
const connectApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === "development" ? "http://localhost:8000/api" : "/api"),
  headers: { "Content-Type": "application/json" },
});

// Interceptor: attach JWT token from localStorage to every request
connectApi.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Interceptor: handle 401 responses (token expired)
connectApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('chill_user_session');
    }
    return Promise.reject(error);
  }
);

export default connectApi;
