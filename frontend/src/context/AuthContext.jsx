import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/endpoints";
import { TOKEN_KEY } from "../api/axiosClient";

const USER_KEY = "clinic_erp_user";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If the axios interceptor sees a 401, log the app out everywhere
  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener("clinic-erp-unauthorized", handleUnauthorized);
    return () => window.removeEventListener("clinic-erp-unauthorized", handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await authApi.login(email, password);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an <AuthProvider>");
  return ctx;
}
