import { useMemo, useState } from "react";
import { Check, Cross, Eye, EyeOff, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RULES = [
  ["At least 8 characters", (value) => value.length >= 8],
  ["One uppercase letter", (value) => /[A-Z]/.test(value)],
  ["One lowercase letter", (value) => /[a-z]/.test(value)],
  ["One number", (value) => /\d/.test(value)],
  ["One special character", (value) => /[^A-Za-z0-9]/.test(value)],
];

function PasswordInput({ label, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <span className="relative block">
        <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 py-3 pl-11 pr-11 text-sm outline-none transition focus:border-teal-400/70 focus:ring-4 focus:ring-teal-400/10"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
    </label>
  );
}

export default function ResetPassword() {
  const { changePassword, loading, error, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const checks = useMemo(() => RULES.map(([label, test]) => [label, test(newPassword)]), [newPassword]);
  const isStrong = checks.every(([, valid]) => valid);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isStrong) return setValidationError("Your new password does not meet all security requirements.");
    if (newPassword !== confirmPassword) return setValidationError("New password and confirmation do not match.");
    if (currentPassword === newPassword) return setValidationError("New password must be different from your current password.");

    setValidationError("");
    if (await changePassword(currentPassword, newPassword)) navigate("/dashboard", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/90 p-7 shadow-2xl shadow-black/30 sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 text-slate-950">
            <Cross size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Create a secure password</h1>
            <p className="mt-1 text-sm text-slate-400">You must change your password before continuing.</p>
          </div>
        </div>

        {(validationError || error) && (
          <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
            {validationError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <PasswordInput label="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
          <PasswordInput label="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />

          <div className="grid gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-4 sm:grid-cols-2">
            {checks.map(([label, valid]) => (
              <div key={label} className={`flex items-center gap-2 text-xs ${valid ? "text-emerald-300" : "text-slate-500"}`}>
                <span className={`flex h-4 w-4 items-center justify-center rounded-full ${valid ? "bg-emerald-400/15" : "bg-slate-800"}`}>
                  <Check size={10} />
                </span>
                {label}
              </div>
            ))}
          </div>

          <PasswordInput label="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />

          <button type="submit" disabled={loading} className="min-h-12 w-full rounded-xl bg-teal-400 px-5 text-sm font-bold text-slate-950 transition hover:bg-teal-300 disabled:opacity-60">
            {loading ? "Updating password..." : "Change password"}
          </button>
          <button type="button" onClick={logout} className="w-full text-sm text-slate-500 transition hover:text-slate-200">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
