import { createContext, useContext, useEffect, useState } from "react";
import authService from "../services/authService";
import { TOKEN_KEY, USER_KEY } from "../services/api";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));
  const [error, setError] = useState("");
  const [sessionMessage, setSessionMessage] = useState("");

  const storeSession = (data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  };

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return undefined;
    }

    authService.profile()
      .then(({ data }) => {
        localStorage.setItem(USER_KEY, JSON.stringify(data));
        setUser(data);
      })
      .catch(() => clearSession())
      .finally(() => setLoading(false));

    return undefined;
  }, []);

  useEffect(() => {
    const handleExpired = () => {
      clearSession();
      setSessionMessage("Your session has expired. Please log in again.");
    };
    window.addEventListener("auth:session-expired", handleExpired);
    return () => window.removeEventListener("auth:session-expired", handleExpired);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError("");
    setSessionMessage("");
    try {
      const { data } = await authService.login(email, password);
      storeSession(data);
      return data.user;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await authService.changePassword(currentPassword, newPassword);
      storeSession(data);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearSession();
    setError("");
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: Boolean(user && localStorage.getItem(TOKEN_KEY)),
      loading,
      error,
      sessionMessage,
      login,
      changePassword,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
