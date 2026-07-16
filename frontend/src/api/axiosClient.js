import axios from "axios";

// Adjust this to wherever your Express API is running.
// Vite:  VITE_API_URL=http://localhost:8081/api  (in a .env file, exposed via import.meta.env)
// CRA:   REACT_APP_API_URL=http://localhost:8081/api  (exposed via process.env)
const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ||
  "http://localhost:8081/api";

const TOKEN_KEY = "clinic_erp_token";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach the JWT (if we have one) to every outgoing request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unwrap the { success, message, data } envelope the backend always returns,
// and turn failed requests into a plain Error with a readable message.
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token missing/expired/invalid -> force a fresh login
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("clinic_erp_user");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("clinic-erp-unauthorized"));
      }
    }
    const message =
      error.response?.data?.message || error.message || "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export { TOKEN_KEY };
export default axiosClient;
