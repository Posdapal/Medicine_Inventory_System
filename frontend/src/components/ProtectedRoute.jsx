import { createElement } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ requirePasswordChange = false }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return createElement(
      "div",
      { className: "flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-400" },
      "Checking your session..."
    );
  }

  if (!isAuthenticated) {
    return createElement(Navigate, { to: "/login", replace: true, state: { from: location } });
  }

  if (requirePasswordChange) {
    return user.mustChangePassword
      ? createElement(Outlet)
      : createElement(Navigate, { to: "/dashboard", replace: true });
  }

  if (user.mustChangePassword) {
    return createElement(Navigate, { to: "/reset-password", replace: true });
  }
  return createElement(Outlet);
}
