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

function withStoredProfileImage(user) {
  if (!user) return user;
  const storedImage = localStorage.getItem(`medicine_inventory_profile_photo_${user.id || "current"}`) || "";
  return { ...user, profileImage: user.profileImage || storedImage };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => withStoredProfileImage(readStoredUser()));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));
  const [error, setError] = useState("");
  const [sessionMessage, setSessionMessage] = useState("");
  const [permissions, setPermissions] = useState({});

  const storeSession = (data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  };

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setPermissions({});
  };

  const updateUser = (changes) => {
    setUser((current) => {
      if (!current) return current;
      const updated = { ...current, ...changes };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return undefined;
    }

    Promise.all([authService.profile(), authService.permissions()])
      .then(([profileResponse, permissionResponse]) => {
        const updatedUser = withStoredProfileImage(profileResponse.data);
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);
        setPermissions(permissionResponse.data?.permissions || {});
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
      const permissionResponse = await authService.permissions();
      setPermissions(permissionResponse.data?.permissions || {});
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
      permissions,
      can: (module, action) => {
        if (String(user?.role).toLowerCase() === "administrator") return true;
        return Boolean(permissions[module]?.[`can_${action}`]);
      },
      login,
      changePassword,
      updateUser,
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
