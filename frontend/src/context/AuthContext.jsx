// import React, { createContext, useContext, useEffect, useState } from "react";
// import { authApi } from "../api/endpoints";
// import { TOKEN_KEY } from "../api/axiosClient";

// const USER_KEY = "clinic_erp_user";
// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(() => {
//     const stored = localStorage.getItem(USER_KEY);
//     return stored ? JSON.parse(stored) : null;
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // If the axios interceptor sees a 401, log the app out everywhere
//   useEffect(() => {
//     const handleUnauthorized = () => setUser(null);
//     window.addEventListener("clinic-erp-unauthorized", handleUnauthorized);
//     return () => window.removeEventListener("clinic-erp-unauthorized", handleUnauthorized);
//   }, []);

//   const login = async (email, password) => {
//     setLoading(true);
//     setError("");
//     try {
//       const { data } = await authApi.login(email, password);
//       localStorage.setItem(TOKEN_KEY, data.token);
//       localStorage.setItem(USER_KEY, JSON.stringify(data.user));
//       setUser(data.user);
//       return true;
//     } catch (err) {
//       setError(err.message);
//       return false;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const logout = () => {
//     localStorage.removeItem(TOKEN_KEY);
//     localStorage.removeItem(USER_KEY);
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout, loading, error, isAuthenticated: !!user }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used within an <AuthProvider>");
//   return ctx;
// }

// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

// 🔒 Static credentials — change these to whatever you want
const STATIC_EMAIL = "admin@clinic.com";
const STATIC_PASSWORD = "admin123";

const SESSION_KEY = "clinic_erp_auth";

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Persist session across page refreshes
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved === "true") setIsAuthenticated(true);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError("");

    // Simulate a small delay like a real request
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (email === STATIC_EMAIL && password === STATIC_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem(SESSION_KEY, "true");
      setLoading(false);
      return true;
    } else {
      setError("Invalid email or password");
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
