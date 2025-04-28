import axios from "axios";

const api = axios.create({
  baseURL: "/auth",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Optional: Response interceptor for errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequestUrl = error.config?.url;

    // If 401 happens on protected APIs only, then redirect
    if (
      error.response?.status === 401 &&
      !originalRequestUrl.includes("/forgot-password") &&
      !originalRequestUrl.includes("/reset-password") &&
      !originalRequestUrl.includes("/signup") &&
      !originalRequestUrl.includes("/login")
    ) {
      localStorage.removeItem("token");
      window.location = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;