import axios from "axios";

export const TOKEN_KEY = "medicine_inventory_token";
export const USER_KEY = "medicine_inventory_user";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8081/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const hadToken = Boolean(localStorage.getItem(TOKEN_KEY));
    if (error.response?.status === 401 && hadToken) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
    }
    const requestError = new Error(
      error.response?.data?.message || error.message || "Something went wrong. Please try again."
    );
    requestError.status = error.response?.status;
    requestError.details = error.response?.data?.errors;
    return Promise.reject(requestError);
  }
);

export default api;
