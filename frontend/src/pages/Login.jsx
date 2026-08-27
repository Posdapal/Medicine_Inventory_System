import { useState } from "react";
import { Cross, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const REMEMBERED_EMAIL_KEY = "medicine_inventory_remembered_email";

export default function Login() {
  const { isAuthenticated, user, login, loading, error, sessionMessage } = useAuth();
  const navigate = useNavigate();
  const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";
  const [email, setEmail] = useState(rememberedEmail);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(Boolean(rememberedEmail));
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  if (isAuthenticated) {
    return <Navigate to={user.mustChangePassword ? "/reset-password" : "/dashboard"} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!email.trim()) nextErrors.username = "Username is required";
    if (!password) nextErrors.password = "Password is required";
    else if (password.length < 8) nextErrors.password = "Password must be at least 8 characters";

    setValidationErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const authenticatedUser = await login(email, password);
    if (!authenticatedUser) return;

    if (rememberMe) localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
    else localStorage.removeItem(REMEMBERED_EMAIL_KEY);

    navigate(authenticatedUser.mustChangePassword ? "/reset-password" : "/dashboard", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl shadow-black/30">
          <form onSubmit={handleSubmit} noValidate className="p-7 sm:p-9">
            <div className="mb-9 flex items-center justify-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 text-slate-950 shadow-lg shadow-teal-950/50">
                <Cross size={22} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold tracking-tight">Medicine Inventory System</span>
            </div>

            <h1 className="text-xl font-semibold">Welcome back</h1>
            <p className="mb-7 mt-1 text-sm text-slate-400">Sign in to manage your medicine inventory.</p>

            {(sessionMessage || error) && (
              <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${sessionMessage ? "border-amber-400/20 bg-amber-400/10 text-amber-200" : "border-rose-400/20 bg-rose-400/10 text-rose-300"}`}>
                {sessionMessage || error}
              </div>
            )}

            <div className="space-y-5">
              <label className="block">
                <span className={`mb-2 block text-sm font-medium ${validationErrors.username ? "text-red-500" : "text-slate-300"}`}>
                  Email<span aria-hidden="true">*</span>
                </span>
                <span className="relative block">
                  <Mail size={17} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${validationErrors.username ? "text-red-500" : "text-slate-500"}`} />
                  <input
                    type="text"
                    autoComplete="username"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (validationErrors.username) {
                        setValidationErrors((current) => ({ ...current, username: undefined }));
                      }
                    }}
                    placeholder="Enter your email"
                    aria-invalid={Boolean(validationErrors.username)}
                    aria-describedby={validationErrors.username ? "username-error" : undefined}
                    className={`min-h-12 w-full rounded-xl border bg-slate-950/60 py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-600 ${validationErrors.username ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/15" : "border-slate-600 focus:border-teal-400/70 focus:ring-4 focus:ring-teal-400/10"}`}
                  />
                </span>
                {validationErrors.username && (
                  <span id="username-error" className="mt-2 block text-sm text-red-500" role="alert">
                    {validationErrors.username}
                  </span>
                )}
              </label>

              <label className="block">
                <span className={`mb-2 block text-sm font-medium ${validationErrors.password ? "text-red-500" : "text-slate-300"}`}>
                  Password<span aria-hidden="true">*</span>
                </span>
                <span className="relative block">
                  <Lock size={17} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${validationErrors.password ? "text-red-500" : "text-slate-500"}`} />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (validationErrors.password) {
                        setValidationErrors((current) => ({ ...current, password: undefined }));
                      }
                    }}
                    placeholder="Enter your password"
                    aria-invalid={Boolean(validationErrors.password)}
                    aria-describedby={validationErrors.password ? "password-error" : undefined}
                    className={`min-h-12 w-full rounded-xl border bg-slate-950/60 py-3 pl-11 pr-11 text-sm outline-none transition placeholder:text-slate-600 ${validationErrors.password ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/15" : "border-slate-600 focus:border-teal-400/70 focus:ring-4 focus:ring-teal-400/10"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
                {validationErrors.password && (
                  <span id="password-error" className="mt-2 block text-sm text-red-500" role="alert">
                    {validationErrors.password}
                  </span>
                )}
              </label>

              <label className="flex w-fit items-center gap-2 text-sm text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 accent-teal-400"
                />
                Remember me
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-400 px-5 text-sm font-bold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
